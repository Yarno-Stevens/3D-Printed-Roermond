package nl.embediq.woocommerce.service;

import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.SyncResult;
import nl.embediq.woocommerce.dto.WooBilling;
import nl.embediq.woocommerce.dto.WooOrder;
import nl.embediq.woocommerce.entity.Customer;
import nl.embediq.woocommerce.entity.Order;
import nl.embediq.woocommerce.entity.OrderItem;
import nl.embediq.woocommerce.entity.SyncStatus;
import nl.embediq.woocommerce.enums.OrderStatus;
import nl.embediq.woocommerce.enums.SyncStatusEnum;
import nl.embediq.woocommerce.enums.SyncType;
import nl.embediq.woocommerce.repository.CustomerRepository;
import nl.embediq.woocommerce.repository.OrderItemRepository;
import nl.embediq.woocommerce.repository.OrderRepository;
import nl.embediq.woocommerce.repository.SyncStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OrderSyncService {
    
    @Autowired
    private WooCommerceClient wooCommerceClient;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private SyncStatusRepository syncStatusRepository;
    
    @Value("${woocommerce.sync.rate-limit-ms}")
    private long rateLimitMs;
    
    @Transactional
    public SyncResult syncOrders() {
        log.info("Starting order sync...");
        
        SyncStatus syncStatus = getOrCreateSyncStatus(SyncType.ORDER);
        syncStatus.setStatus(SyncStatusEnum.RUNNING);
        syncStatus.setLastAttemptedSync(LocalDateTime.now());
        syncStatus = syncStatusRepository.save(syncStatus);
        
        int processedCount = 0;
        int failedCount = 0;
        int page = syncStatus.getLastProcessedPage() != null 
            ? syncStatus.getLastProcessedPage() + 1 
            : 1;
        
        try {
            LocalDateTime modifiedAfter = syncStatus.getLastSuccessfulSync();
            
            while (true) {
                List<WooOrder> wooOrders = wooCommerceClient.getOrders(page, modifiedAfter);
                
                if (wooOrders.isEmpty()) {
                    log.info("No more orders to sync");
                    break;
                }
                
                for (WooOrder wooOrder : wooOrders) {
                    try {
                        processOrder(wooOrder);
                        processedCount++;
                    } catch (Exception e) {
                        log.error("Failed to process order {}", wooOrder.getId(), e);
                        failedCount++;
                    }
                }
                
                // Update progress
                syncStatus.setLastProcessedPage(page);
                syncStatus.setTotalRecordsProcessed(processedCount);
                syncStatus.setFailedRecords(failedCount);
                syncStatusRepository.save(syncStatus);
                
                // Check if we got less than expected (last page)
                if (wooOrders.size() < 100) {
                    log.info("Received partial page, sync complete");
                    break;
                }
                
                page++;
                
                // Rate limiting
                Thread.sleep(rateLimitMs);
            }
            
            // Mark as successful
            syncStatus.setStatus(SyncStatusEnum.SUCCESS);
            syncStatus.setLastSuccessfulSync(LocalDateTime.now());
            syncStatus.setLastProcessedPage(null); // Reset for next run
            syncStatus.setErrorMessage(null);
            syncStatusRepository.save(syncStatus);
            
            log.info("Order sync completed: processed={}, failed={}", 
                processedCount, failedCount);
            
            return new SyncResult(true, processedCount, failedCount, null);
            
        } catch (Exception e) {
            log.error("Order sync failed", e);
            
            syncStatus.setStatus(SyncStatusEnum.FAILED);
            syncStatus.setErrorMessage(e.getMessage());
            syncStatusRepository.save(syncStatus);
            
            return new SyncResult(false, processedCount, failedCount, e.getMessage());
        }
    }
    
    @Transactional
    public void processOrder(WooOrder wooOrder) {
        log.debug("Processing order: {}", wooOrder.getId());
        
        // Find or create customer first
        Customer customer = null;
        if (wooOrder.getCustomerId() != null && wooOrder.getCustomerId() > 0) {
            customer = customerRepository.findByWooCommerceId(wooOrder.getCustomerId())
                .orElseGet(() -> {
                    log.warn("Customer {} not found for order {}", 
                        wooOrder.getCustomerId(), wooOrder.getId());
                    return null;
                });
        } else if (wooOrder.getBilling() != null) {
            // Guest checkout
            customer = createGuestCustomer(wooOrder.getBilling());
        }
        
        // Find or create order
        Order order = orderRepository.findByWooCommerceId(wooOrder.getId())
            .orElse(new Order());
        
        boolean isNewOrder = order.getId() == null;
        
        // Map order data
        order.setWooCommerceId(wooOrder.getId());
        order.setOrderNumber(wooOrder.getOrderNumber());
        order.setTotal(new BigDecimal(wooOrder.getTotal()));
        order.setStatus(mapOrderStatus(wooOrder.getStatus()));
        order.setCustomer(customer);
        order.setCreatedAt(parseWooDate(wooOrder.getDateCreated()));
        order.setUpdatedAt(parseWooDate(wooOrder.getDateModified()));
        order.setLastSyncedAt(LocalDateTime.now());
        
        // Save order first
        order = orderRepository.save(order);
        
        // Process line items
        if (wooOrder.getLineItems() != null && !wooOrder.getLineItems().isEmpty()) {
            
            // Clear old items if updating
            if (!isNewOrder) {
                orderItemRepository.deleteByOrderId(order.getId());
            }
            
            // Create new items
            final Order finalOrder = order;
            List<OrderItem> items = wooOrder.getLineItems().stream()
                .map(wooItem -> {
                    OrderItem item = new OrderItem();
                    item.setOrder(finalOrder);
                    item.setProductId(wooItem.getProductId());
                    item.setProductName(wooItem.getName());
                    item.setQuantity(wooItem.getQuantity());
                    item.setTotal(new BigDecimal(wooItem.getTotal()));
                    return item;
                })
                .collect(Collectors.toList());
            
            orderItemRepository.saveAll(items);
        }
        
        log.debug("Order {} saved successfully with {} items", 
            order.getWooCommerceId(), 
            wooOrder.getLineItems() != null ? wooOrder.getLineItems().size() : 0);
    }
    
    private Customer createGuestCustomer(WooBilling billing) {
        if (billing.getEmail() != null) {
            Optional<Customer> existing = customerRepository.findByEmail(billing.getEmail());
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        
        Customer customer = new Customer();
        customer.setWooCommerceId(0L);
        customer.setEmail(billing.getEmail());
        customer.setFirstName(billing.getFirstName());
        customer.setLastName(billing.getLastName());
        customer.setLastSyncedAt(LocalDateTime.now());
        
        return customerRepository.save(customer);
    }
    
    private OrderStatus mapOrderStatus(String wooStatus) {
        try {
            return OrderStatus.valueOf(wooStatus.toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            log.warn("Unknown order status: {}, defaulting to PENDING", wooStatus);
            return OrderStatus.PENDING;
        }
    }
    
    private LocalDateTime parseWooDate(String dateString) {
        if (dateString == null) return null;
        try {
            return LocalDateTime.parse(dateString, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            log.error("Failed to parse date: {}", dateString);
            return null;
        }
    }
    
    private SyncStatus getOrCreateSyncStatus(SyncType syncType) {
        return syncStatusRepository.findBySyncType(syncType)
            .orElseGet(() -> {
                SyncStatus status = new SyncStatus();
                status.setSyncType(syncType);
                status.setStatus(SyncStatusEnum.SUCCESS);
                return status;
            });
    }
}
