package nl.embediq.woocommerce.controller;

import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.*;
import nl.embediq.woocommerce.entity.Customer;
import nl.embediq.woocommerce.entity.Order;
import nl.embediq.woocommerce.entity.SyncStatus;
import nl.embediq.woocommerce.enums.SyncStatusEnum;
import nl.embediq.woocommerce.enums.SyncType;
import nl.embediq.woocommerce.repository.CustomerRepository;
import nl.embediq.woocommerce.repository.OrderRepository;
import nl.embediq.woocommerce.repository.SyncStatusRepository;
import nl.embediq.woocommerce.service.CustomerSyncService;
import nl.embediq.woocommerce.service.OrderSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/sync")
@Slf4j
public class SyncMonitorController {
    
    @Autowired
    private SyncStatusRepository syncStatusRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private OrderSyncService orderSyncService;
    
    @Autowired
    private CustomerSyncService customerSyncService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<SyncDashboard> getDashboard() {
        List<SyncStatus> statuses = syncStatusRepository.findAll();
        
        SyncStatus orderSync = statuses.stream()
            .filter(s -> s.getSyncType() == SyncType.ORDER)
            .findFirst()
            .orElse(null);
            
        SyncStatus customerSync = statuses.stream()
            .filter(s -> s.getSyncType() == SyncType.CUSTOMER)
            .findFirst()
            .orElse(null);
        
        long totalOrders = orderRepository.count();
        long totalCustomers = customerRepository.count();
        long ordersSyncedToday = orderRepository.countSyncedSince(
            LocalDateTime.now().minusDays(1)
        );
        
        SyncDashboard dashboard = new SyncDashboard();
        dashboard.setOrderSync(orderSync);
        dashboard.setCustomerSync(customerSync);
        dashboard.setTotalOrders(totalOrders);
        dashboard.setTotalCustomers(totalCustomers);
        dashboard.setOrdersSyncedToday(ordersSyncedToday);
        dashboard.setLastUpdate(LocalDateTime.now());
        
        return ResponseEntity.ok(dashboard);
    }
    
    @GetMapping("/orders/recent")
    public ResponseEntity<List<OrderSyncInfo>> getRecentOrders(
            @RequestParam(defaultValue = "20") int limit) {
        
        List<Order> orders = orderRepository.findAll().stream()
            .filter(o -> o.getLastSyncedAt() != null)
            .sorted((o1, o2) -> o2.getLastSyncedAt().compareTo(o1.getLastSyncedAt()))
            .limit(limit)
            .collect(Collectors.toList());
        
        List<OrderSyncInfo> orderInfos = orders.stream()
            .map(o -> {
                OrderSyncInfo info = new OrderSyncInfo();
                info.setOrderNumber(o.getOrderNumber());
                info.setWooCommerceId(o.getWooCommerceId());
                info.setStatus(o.getStatus().toString());
                info.setTotal(o.getTotal());
                info.setCustomerName(o.getCustomer() != null ? 
                    o.getCustomer().getFirstName() + " " + o.getCustomer().getLastName() : 
                    "Guest");
                info.setSyncedAt(o.getLastSyncedAt());
                info.setCreatedAt(o.getCreatedAt());
                return info;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(orderInfos);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<SyncStats> getStats() {
        SyncStats stats = new SyncStats();
        
        // Orders per status
        Map<String, Long> ordersByStatus = orderRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                o -> o.getStatus().toString(),
                Collectors.counting()
            ));
        stats.setOrdersByStatus(ordersByStatus);
        
        // Orders per dag (laatste 7 dagen)
        Map<String, Long> ordersPerDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);
            
            long count = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> o.getCreatedAt().isAfter(startOfDay) && 
                           o.getCreatedAt().isBefore(endOfDay))
                .count();
            
            ordersPerDay.put(date.toString(), count);
        }
        stats.setOrdersPerDay(ordersPerDay);
        
        // Top 5 klanten
        List<CustomerStats> topCustomers = customerRepository.findAll().stream()
            .filter(c -> c.getOrders() != null && !c.getOrders().isEmpty())
            .map(c -> {
                CustomerStats cs = new CustomerStats();
                cs.setName(c.getFirstName() + " " + c.getLastName());
                cs.setEmail(c.getEmail());
                cs.setOrderCount(c.getOrders().size());
                cs.setTotalSpent(c.getOrders().stream()
                    .map(Order::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
                return cs;
            })
            .sorted((c1, c2) -> c2.getOrderCount().compareTo(c1.getOrderCount()))
            .limit(5)
            .collect(Collectors.toList());
        
        stats.setTopCustomers(topCustomers);
        
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, String>> triggerSync() {
        new Thread(() -> {
            try {
                customerSyncService.syncCustomers();
                orderSyncService.syncOrders();
            } catch (Exception e) {
                log.error("Error during manual sync", e);
            }
        }).start();
        
        return ResponseEntity.ok(Map.of(
            "message", "Sync gestart op de achtergrond",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
    
    @PostMapping("/stop/{syncType}")
    public ResponseEntity<Map<String, String>> stopSync(@PathVariable String syncType) {
        SyncStatus status = syncStatusRepository.findBySyncType(
            SyncType.valueOf(syncType.toUpperCase())
        ).orElse(null);
        
        if (status != null) {
            status.setStatus(SyncStatusEnum.PAUSED);
            syncStatusRepository.save(status);
            
            return ResponseEntity.ok(Map.of(
                "message", "Sync gepauzeerd",
                "syncType", syncType
            ));
        }
        
        return ResponseEntity.notFound().build();
    }
}
