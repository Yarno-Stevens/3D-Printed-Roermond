package nl.embediq.woocommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.OrderItemMetadataDTO;
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private EntityManager entityManager;

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

                        // CRITICAL: Clear the EntityManager to prevent session corruption
                        // This removes any entities in a corrupted state from the persistence context
                        entityManager.clear();
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

    @Transactional(propagation = Propagation.REQUIRED)
    public void processOrder(WooOrder wooOrder) {
        log.debug("Processing order: {}", wooOrder.getId());

        try {
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

                            // Map metadata including product addons
                            if (wooItem.getMetaData() != null && !wooItem.getMetaData().isEmpty()) {
                                try {
                                    ObjectMapper mapper = new ObjectMapper();

                                    // Filter and convert metadata to OrderItemMetadataDTO
                                    // Only include metadata that:
                                    // 1. Doesn't start with _ (internal WooCommerce fields)
                                    // 2. Has a simple string or primitive value (not complex objects)
                                    List<OrderItemMetadataDTO> metadataList = wooItem.getMetaData().stream()
                                            .filter(meta -> {
                                                // Skip internal keys
                                                if (meta.getKey() == null || meta.getKey().startsWith("_")) {
                                                    return false;
                                                }
                                                // Skip complex nested objects (like WCPA internal data)
                                                if (meta.getValue() instanceof Map || meta.getValue() instanceof List) {
                                                    return false;
                                                }
                                                // Skip if display_value is a complex object (Map or List)
                                                if (meta.getDisplayValue() != null &&
                                                    (meta.getDisplayValue() instanceof Map || meta.getDisplayValue() instanceof List)) {
                                                    return false;
                                                }
                                                return true;
                                            })
                                            .map(meta -> {
                                                OrderItemMetadataDTO metaDTO = new OrderItemMetadataDTO();
                                                metaDTO.setKey(meta.getKey());
                                                metaDTO.setDisplayKey(meta.getDisplayKey() != null ? meta.getDisplayKey() : meta.getKey());
                                                metaDTO.setValue(meta.getValue() != null ? meta.getValue().toString() : "");
                                                // Convert displayValue to String safely
                                                String displayValueStr = metaDTO.getValue();
                                                if (meta.getDisplayValue() != null) {
                                                    displayValueStr = meta.getDisplayValue().toString();
                                                }
                                                metaDTO.setDisplayValue(displayValueStr);
                                                return metaDTO;
                                            })
                                            .collect(Collectors.toList());

                                    if (!metadataList.isEmpty()) {
                                        String metadataJson = mapper.writeValueAsString(metadataList);
                                        item.setMetadata(metadataJson);
                                        log.debug("Saved {} metadata items for order item {}", metadataList.size(), wooItem.getId());
                                    }
                                } catch (Exception e) {
                                    log.warn("Failed to serialize metadata for order item {}: {}", wooItem.getId(), e.getMessage());
                                }
                            }

                            return item;
                        })
                        .collect(Collectors.toList());

                orderItemRepository.saveAll(items);
            }

            log.debug("Order {} saved successfully with {} items",
                    order.getWooCommerceId(),
                    wooOrder.getLineItems() != null ? wooOrder.getLineItems().size() : 0);

        } catch (Exception e) {
            log.error("Error processing order {}: {}", wooOrder.getId(), e.getMessage());
            throw e; // Re-throw so the outer catch block can handle it
        }
    }

    private Customer createGuestCustomer(WooBilling billing) {
        // Validate billing data first to prevent null/empty email queries
        if (billing == null) {
            log.warn("Billing data is null, cannot create guest customer");
            return null;
        }

        if (billing.getEmail() == null || billing.getEmail().trim().isEmpty()) {
            log.warn("Email is null or empty in billing data, cannot create guest customer");
            return null;
        }

        // Check for existing customer by email (email is now unique key)
        try {
            Optional<Customer> existing = customerRepository.findByEmail(billing.getEmail());
            if (existing.isPresent()) {
                Customer customer = existing.get();

                // Update address if customer doesn't have one yet
                boolean needsUpdate = false;
                if (customer.getAddress() == null || customer.getAddress().isEmpty()) {
                    customer.setCompanyName(billing.getCompany());
                    customer.setPhone(billing.getPhone());
                    customer.setAddress(billing.getAddress1());
                    customer.setAddress2(billing.getAddress2());
                    customer.setCity(billing.getCity());
                    customer.setPostalCode(billing.getPostcode());
                    customer.setState(billing.getState());
                    customer.setCountry(billing.getCountry());
                    needsUpdate = true;
                }

            log.debug("Created new guest customer with email and address: {}", billing.getEmail());
                if (customer.getCompanyName() == null || customer.getCompanyName().isEmpty()) {
                    if (billing.getCompany() != null && !billing.getCompany().isEmpty()) {
                        customer.setCompanyName(billing.getCompany());
                        needsUpdate = true;
                    }
                }

                // Also update name if it was empty
                if (customer.getFirstName() == null || customer.getFirstName().isEmpty()) {
                    customer.setFirstName(billing.getFirstName());
                    needsUpdate = true;
                }
                if (customer.getLastName() == null || customer.getLastName().isEmpty()) {
                    customer.setLastName(billing.getLastName());
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    customer.setLastSyncedAt(LocalDateTime.now());
                    customer = customerRepository.save(customer);
                    log.debug("Updated customer {} with address information", customer.getEmail());
                }

                return customer;
            }
        } catch (Exception e) {
            log.error("Error finding customer by email {}: {}", billing.getEmail(), e.getMessage());
            // Continue to create new customer
        }

        // Create new guest customer
        // woo_commerce_id is NULL for guests, email is the unique identifier
        Customer customer = new Customer();
        customer.setWooCommerceId(null);
        customer.setEmail(billing.getEmail());
        customer.setFirstName(billing.getFirstName());
        customer.setLastName(billing.getLastName());
        customer.setCompanyName(billing.getCompany());

        // Add address information from billing
        customer.setPhone(billing.getPhone());
        customer.setAddress(billing.getAddress1());
        customer.setAddress2(billing.getAddress2());
        customer.setCity(billing.getCity());
        customer.setPostalCode(billing.getPostcode());
        customer.setState(billing.getState());
        customer.setCountry(billing.getCountry());

        customer.setLastSyncedAt(LocalDateTime.now());

        try {
            customer = customerRepository.save(customer);
            log.debug("Created new guest customer with email: {}", billing.getEmail());
            return customer;
        } catch (Exception e) {
            log.error("Error saving guest customer with email {}: {}", billing.getEmail(), e.getMessage());
            return null;
        }
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

