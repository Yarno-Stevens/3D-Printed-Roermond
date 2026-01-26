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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/sync")
@CrossOrigin(origins = "*")
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

    // ==================== DASHBOARD ====================

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

    // ==================== ORDERS ENDPOINTS ====================

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderDTO>> getOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        List<Order> allOrders = orderRepository.findAll();

        // Apply filters
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            allOrders = allOrders.stream()
                    .filter(o ->
                            o.getOrderNumber().toLowerCase().contains(searchLower) ||
                                    (o.getCustomer() != null &&
                                            (o.getCustomer().getFirstName().toLowerCase().contains(searchLower) ||
                                                    o.getCustomer().getLastName().toLowerCase().contains(searchLower) ||
                                                    o.getCustomer().getEmail().toLowerCase().contains(searchLower)))
                    )
                    .collect(Collectors.toList());
        }

        if (status != null && !status.isEmpty()) {
            allOrders = allOrders.stream()
                    .filter(o -> o.getStatus().toString().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        if (dateFrom != null) {
            allOrders = allOrders.stream()
                    .filter(o -> o.getCreatedAt().isAfter(dateFrom))
                    .collect(Collectors.toList());
        }

        if (dateTo != null) {
            allOrders = allOrders.stream()
                    .filter(o -> o.getCreatedAt().isBefore(dateTo))
                    .collect(Collectors.toList());
        }

        // Convert to DTOs with pagination
        List<OrderDTO> orderDTOs = allOrders.stream()
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .skip((long) page * size)
                .limit(size)
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());

        long total = allOrders.size();
        Page<OrderDTO> orderPage = new PageImpl<>(orderDTOs, pageable, total);

        return ResponseEntity.ok(orderPage);
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

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(this::convertToOrderDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== CUSTOMERS ENDPOINTS ====================

    @GetMapping("/customers")
    public ResponseEntity<Page<CustomerDTO>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        List<Customer> allCustomers = customerRepository.findAll();

        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            allCustomers = allCustomers.stream()
                    .filter(c ->
                            c.getFirstName().toLowerCase().contains(searchLower) ||
                                    c.getLastName().toLowerCase().contains(searchLower) ||
                                    c.getEmail().toLowerCase().contains(searchLower)
                    )
                    .collect(Collectors.toList());
        }

        if (dateFrom != null) {
            allCustomers = allCustomers.stream()
                    .filter(c -> c.getCreatedAt().isAfter(dateFrom))
                    .collect(Collectors.toList());
        }

        if (dateTo != null) {
            allCustomers = allCustomers.stream()
                    .filter(c -> c.getCreatedAt().isBefore(dateTo))
                    .collect(Collectors.toList());
        }

        List<CustomerDTO> customerDTOs = allCustomers.stream()
                .sorted((c1, c2) -> c2.getCreatedAt().compareTo(c1.getCreatedAt()))
                .skip((long) page * size)
                .limit(size)
                .map(this::convertToCustomerDTO)
                .collect(Collectors.toList());

        long total = allCustomers.size();
        Page<CustomerDTO> customerPage = new PageImpl<>(customerDTOs, pageable, total);

        return ResponseEntity.ok(customerPage);
    }

    @GetMapping("/customers/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id)
                .map(this::convertToCustomerDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== STATS ENDPOINTS ====================

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

    // ==================== SYNC CONTROL ====================

    @PostMapping("/trigger")
    public ResponseEntity<Map<String, String>> triggerSync() {
        new Thread(() -> {
            try {
                log.info("Starting manual sync...");
                customerSyncService.syncCustomers();
                orderSyncService.syncOrders();
                log.info("Manual sync completed");
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

    // ==================== HELPER METHODS ====================

    private OrderDTO convertToOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setWooCommerceId(order.getWooCommerceId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setStatus(order.getStatus().toString());
        dto.setTotal(order.getTotal());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setSyncedAt(order.getLastSyncedAt());

        if (order.getCustomer() != null) {
            CustomerDTO customerDTO = new CustomerDTO();
            customerDTO.setId(order.getCustomer().getId());
            customerDTO.setFirstName(order.getCustomer().getFirstName());
            customerDTO.setLastName(order.getCustomer().getLastName());
            customerDTO.setEmail(order.getCustomer().getEmail());
            dto.setCustomer(customerDTO);
        }

        dto.setItemsCount(order.getItems() != null ? order.getItems().size() : 0);

        return dto;
    }

    private CustomerDTO convertToCustomerDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setWooCommerceId(customer.getWooCommerceId());
        dto.setEmail(customer.getEmail());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setLastSyncedAt(customer.getLastSyncedAt());
        return dto;
    }
}