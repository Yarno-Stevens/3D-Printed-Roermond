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
import nl.embediq.woocommerce.repository.ProductRepository;
import nl.embediq.woocommerce.repository.SyncStatusRepository;
import nl.embediq.woocommerce.service.CustomerSyncService;
import nl.embediq.woocommerce.service.OrderSyncService;
import nl.embediq.woocommerce.service.ProductSyncService;
import nl.embediq.woocommerce.service.WooCommerceSyncScheduler;
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
    private ProductRepository productRepository;

    @Autowired
    private nl.embediq.woocommerce.repository.ExpenseRepository expenseRepository;

    @Autowired
    private OrderSyncService orderSyncService;

    @Autowired
    private CustomerSyncService customerSyncService;

    @Autowired
    private ProductSyncService productSyncService;

    @Autowired
    private nl.embediq.woocommerce.service.SkuGeneratorService skuGeneratorService;

    @Autowired
    private nl.embediq.woocommerce.service.PdfGeneratorService pdfGeneratorService;

    @Autowired
    private nl.embediq.woocommerce.service.DashboardService dashboardService;

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<SyncDashboard> getDashboard(
            @RequestParam(required = false) Integer year) {
        List<SyncStatus> statuses = syncStatusRepository.findAll();

        SyncStatus orderSync = statuses.stream()
                .filter(s -> s.getSyncType() == SyncType.ORDER)
                .findFirst()
                .orElse(null);

        SyncStatus customerSync = statuses.stream()
                .filter(s -> s.getSyncType() == SyncType.CUSTOMER)
                .findFirst()
                .orElse(null);

        SyncStatus productSync = statuses.stream()
                .filter(s -> s.getSyncType() == SyncType.PRODUCT)
                .findFirst()
                .orElse(null);

        long totalOrders = orderRepository.count();
        long totalCustomers = customerRepository.count();
        long totalProducts = productRepository.count();
        long ordersSyncedToday = orderRepository.countSyncedSince(
                LocalDateTime.now().minusDays(1)
        );
        long customersSyncedToday = customerRepository.countSyncedSince(
                LocalDateTime.now().minusDays(1)
        );
        long productsSyncedToday = productRepository.countSyncedSince(
                LocalDateTime.now().minusDays(1)
        );


        SyncDashboard dashboard = new SyncDashboard();
        dashboard.setOrderSync(orderSync);
        dashboard.setCustomerSync(customerSync);
        dashboard.setProductSync(productSync);
        dashboard.setTotalOrders(totalOrders);
        dashboard.setTotalCustomers(totalCustomers);
        dashboard.setTotalProducts(totalProducts);
        dashboard.setOrdersSyncedToday(ordersSyncedToday);
        dashboard.setCustomersSyncedToday(customersSyncedToday);
        dashboard.setProductsSyncedToday(productsSyncedToday);
        dashboard.setLastUpdate(LocalDateTime.now());

        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/revenue/stats")
    public ResponseEntity<Map<String, Object>> getRevenueStats(
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "month") String groupBy,
            @RequestParam(required = false) Integer week) {

        try {
            Map<String, Object> stats = dashboardService.getRevenueStatistics(year, groupBy, week);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to get revenue stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/customers/top")
    public ResponseEntity<List<Map<String, Object>>> getTopCustomers(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            List<Map<String, Object>> topCustomers = dashboardService.getTopCustomers(limit);
            return ResponseEntity.ok(topCustomers);
        } catch (Exception e) {
            log.error("Failed to get top customers", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== PRODUCTS ENDPOINTS ====================

    @GetMapping("/products")
    public ResponseEntity<Page<ProductDTO>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String minPrice,
            @RequestParam(required = false) String maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        List<nl.embediq.woocommerce.entity.Product> allProducts = productRepository.findAll();

        // Apply filters
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            allProducts = allProducts.stream()
                    .filter(p ->
                            p.getName().toLowerCase().contains(searchLower) ||
                                    (p.getSku() != null && p.getSku().toLowerCase().contains(searchLower))
                    )
                    .collect(Collectors.toList());
        }

        if (status != null && !status.isEmpty()) {
            allProducts = allProducts.stream()
                    .filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        if (minPrice != null && !minPrice.isEmpty()) {
            BigDecimal min = new BigDecimal(minPrice);
            allProducts = allProducts.stream()
                    .filter(p -> p.getPrice() != null && p.getPrice().compareTo(min) >= 0)
                    .collect(Collectors.toList());
        }

        if (maxPrice != null && !maxPrice.isEmpty()) {
            BigDecimal max = new BigDecimal(maxPrice);
            allProducts = allProducts.stream()
                    .filter(p -> p.getPrice() != null && p.getPrice().compareTo(max) <= 0)
                    .collect(Collectors.toList());
        }

        // Convert to DTOs with pagination
        List<ProductDTO> productDTOs = allProducts.stream()
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                .skip((long) page * size)
                .limit(size)
                .map(p -> {
                    ProductDTO dto = new ProductDTO();
                    dto.setId(p.getId());
                    dto.setWooCommerceId(p.getWooCommerceId());
                    dto.setName(p.getName());
                    dto.setSku(p.getSku());
                    dto.setPrice(p.getPrice());
                    dto.setRegularPrice(p.getRegularPrice());
                    dto.setSalePrice(p.getSalePrice());
                    dto.setDescription(p.getDescription());
                    dto.setShortDescription(p.getShortDescription());
                    dto.setType(p.getType());
                    dto.setStatus(p.getStatus());
                    dto.setCreatedAt(p.getCreatedAt());
                    dto.setLastSyncedAt(p.getLastSyncedAt());
                    return dto;
                })
                .collect(Collectors.toList());

        long total = allProducts.size();
        Page<ProductDTO> productPage = new PageImpl<>(productDTOs, pageable, total);

        return ResponseEntity.ok(productPage);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        nl.embediq.woocommerce.entity.Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product niet gevonden met id: " + id));

        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setWooCommerceId(product.getWooCommerceId());
        dto.setName(product.getName());
        dto.setSku(product.getSku());
        dto.setPrice(product.getPrice());
        dto.setRegularPrice(product.getRegularPrice());
        dto.setSalePrice(product.getSalePrice());
        dto.setDescription(product.getDescription());
        dto.setShortDescription(product.getShortDescription());
        dto.setType(product.getType());
        dto.setStatus(product.getStatus());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setLastSyncedAt(product.getLastSyncedAt());

        // Map variations
        if (product.getVariations() != null && !product.getVariations().isEmpty()) {
            List<ProductVariationDTO> variationDTOs = product.getVariations().stream()
                    .map(v -> {
                        ProductVariationDTO varDTO = new ProductVariationDTO();
                        varDTO.setId(v.getId());
                        varDTO.setWooCommerceId(v.getWooCommerceId());
                        varDTO.setSku(v.getSku());
                        varDTO.setPrice(v.getPrice());
                        varDTO.setRegularPrice(v.getRegularPrice());
                        varDTO.setSalePrice(v.getSalePrice());
                        varDTO.setDescription(v.getDescription());
                        varDTO.setAttributes(v.getAttributes());
                        varDTO.setWeight(v.getWeight());
                        varDTO.setDimensions(v.getDimensions());
                        varDTO.setStatus(v.getStatus());
                        varDTO.setCreatedAt(v.getCreatedAt());
                        varDTO.setLastSyncedAt(v.getLastSyncedAt());
                        return varDTO;
                    })
                    .collect(Collectors.toList());
            dto.setVariations(variationDTOs);
        }

        return ResponseEntity.ok(dto);
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

    @GetMapping("/orders/{id}/pdf")
    public ResponseEntity<byte[]> downloadOrderPdf(@PathVariable Long id) {
        try {
            Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

            byte[] pdfBytes = pdfGeneratorService.generateOrderPdf(order);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "order-" + order.getOrderNumber() + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);

        } catch (Exception e) {
            log.error("Failed to generate PDF for order {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
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

    @GetMapping("/customers/{customerId}/orders")
    public ResponseEntity<List<OrderDTO>> getOrdersByCustomer(@PathVariable Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            return ResponseEntity.notFound().build();
        }

        List<Order> customerOrders = orderRepository.findAll().stream()
                .filter(o -> o.getCustomer() != null && o.getCustomer().getId().equals(customerId))
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .collect(Collectors.toList());

        List<OrderDTO> orderDTOs = customerOrders.stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(orderDTOs);
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
                productSyncService.syncProducts();
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

        // Map order items with metadata
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<OrderItemDTO> itemDTOs = order.getItems().stream()
                    .map(item -> {
                        OrderItemDTO itemDTO = new OrderItemDTO();
                        itemDTO.setId(item.getId());
                        itemDTO.setProductId(item.getProductId());
                        itemDTO.setProductName(item.getProductName());
                        itemDTO.setQuantity(item.getQuantity());
                        itemDTO.setTotal(item.getTotal());

                        // Parse metadata JSON
                        if (item.getMetadata() != null && !item.getMetadata().isEmpty()) {
                            try {
                                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                                List<OrderItemMetadataDTO> metadataList = mapper.readValue(
                                        item.getMetadata(),
                                        mapper.getTypeFactory().constructCollectionType(List.class, OrderItemMetadataDTO.class)
                                );
                                itemDTO.setMetadata(metadataList);
                            } catch (Exception e) {
                                // If parsing fails, leave metadata empty
                                log.warn("Failed to parse metadata for order item {}: {}", item.getId(), e.getMessage());
                            }
                        }

                        return itemDTO;
                    })
                    .collect(Collectors.toList());
            dto.setItems(itemDTOs);
        }

        return dto;
    }

    private CustomerDTO convertToCustomerDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setWooCommerceId(customer.getWooCommerceId());
        dto.setEmail(customer.getEmail());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        dto.setCompanyName(customer.getCompanyName());
        dto.setPhone(customer.getPhone());
        dto.setAddress(customer.getAddress());
        dto.setAddress2(customer.getAddress2());
        dto.setCity(customer.getCity());
        dto.setPostalCode(customer.getPostalCode());
        dto.setState(customer.getState());
        dto.setCountry(customer.getCountry());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setLastSyncedAt(customer.getLastSyncedAt());
        return dto;
    }

    private ProductDTO convertToProductDTO(nl.embediq.woocommerce.entity.Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setWooCommerceId(product.getWooCommerceId());
        dto.setName(product.getName());
        dto.setSku(product.getSku());
        dto.setPrice(product.getPrice());
        dto.setRegularPrice(product.getRegularPrice());
        dto.setSalePrice(product.getSalePrice());
        dto.setDescription(product.getDescription());
        dto.setShortDescription(product.getShortDescription());
        dto.setType(product.getType());
        dto.setStatus(product.getStatus());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setLastSyncedAt(product.getLastSyncedAt());

        // Include variations
        if (product.getVariations() != null && !product.getVariations().isEmpty()) {
            List<ProductVariationDTO> variationDTOs = product.getVariations().stream()
                .map(v -> {
                    ProductVariationDTO varDTO = new ProductVariationDTO();
                    varDTO.setId(v.getId());
                    varDTO.setWooCommerceId(v.getWooCommerceId());
                    varDTO.setSku(v.getSku());
                    varDTO.setPrice(v.getPrice());
                    varDTO.setRegularPrice(v.getRegularPrice());
                    varDTO.setSalePrice(v.getSalePrice());
                    varDTO.setDescription(v.getDescription());
                    varDTO.setAttributes(v.getAttributes());
                    varDTO.setWeight(v.getWeight());
                    varDTO.setDimensions(v.getDimensions());
                    varDTO.setStatus(v.getStatus());
                    varDTO.setCreatedAt(v.getCreatedAt());
                    varDTO.setLastSyncedAt(v.getLastSyncedAt());
                    return varDTO;
                })
                .collect(Collectors.toList());
            dto.setVariations(variationDTOs);
        }

        return dto;
    }

    @PostMapping("/orders/create")
    public ResponseEntity<?> createOrder(@RequestBody OrderCreateRequest request) {
        try {
            log.info("Creating new order with {} items", request.getItems().size());

            // Find or create customer
            Customer customer;
            if (request.getCustomerId() != null) {
                customer = customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new RuntimeException("Customer not found"));
            } else {
                // Create new customer
                customer = new Customer();
                customer.setEmail(request.getCustomerEmail());
                customer.setFirstName(request.getCustomerFirstName());
                customer.setLastName(request.getCustomerLastName());
                customer.setCreatedAt(LocalDateTime.now());
                customer = customerRepository.save(customer);
            }

            // Create order
            Order order = new Order();
            order.setCustomer(customer);
            order.setOrderNumber("MANUAL-" + System.currentTimeMillis());
            order.setStatus(nl.embediq.woocommerce.enums.OrderStatus.PROCESSING);
            order.setCreatedAt(LocalDateTime.now());

            // Calculate total
            BigDecimal total = BigDecimal.ZERO;
            for (OrderCreateRequest.OrderItemRequest itemReq : request.getItems()) {
                BigDecimal itemTotal = itemReq.getPrice().multiply(new BigDecimal(itemReq.getQuantity()));
                total = total.add(itemTotal);
            }
            order.setTotal(total);

            order = orderRepository.save(order);

            // Create order items
            for (OrderCreateRequest.OrderItemRequest itemReq : request.getItems()) {
                nl.embediq.woocommerce.entity.OrderItem orderItem = new nl.embediq.woocommerce.entity.OrderItem();
                orderItem.setOrder(order);
                orderItem.setProductId(itemReq.getProductId());
                orderItem.setProductName(itemReq.getProductName());
                orderItem.setQuantity(itemReq.getQuantity());
                orderItem.setTotal(itemReq.getPrice().multiply(new BigDecimal(itemReq.getQuantity())));
                order.getItems().add(orderItem);
            }

            order = orderRepository.save(order);

            log.info("Order created successfully with ID: {}", order.getId());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "orderId", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "message", "Order created successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to create order", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/products/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam(required = false) String query) {
        try {
            List<nl.embediq.woocommerce.entity.Product> products;

            if (query != null && !query.isEmpty()) {
                products = productRepository.findAll().stream()
                    .filter(p -> p.getName().toLowerCase().contains(query.toLowerCase()) ||
                                (p.getSku() != null && p.getSku().toLowerCase().contains(query.toLowerCase())))
                    .limit(20)
                    .collect(Collectors.toList());
            } else {
                products = productRepository.findAll().stream()
                    .limit(20)
                    .collect(Collectors.toList());
            }

            List<ProductDTO> dtos = products.stream()
                .map(this::convertToProductDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Failed to search products", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/customers/search")
    public ResponseEntity<List<CustomerDTO>> searchCustomers(@RequestParam(required = false) String query) {
        try {
            List<Customer> customers;

            if (query != null && !query.isEmpty()) {
                String searchLower = query.toLowerCase();
                customers = customerRepository.findAll().stream()
                    .filter(c ->
                        c.getEmail().toLowerCase().contains(searchLower) ||
                        c.getFirstName().toLowerCase().contains(searchLower) ||
                        c.getLastName().toLowerCase().contains(searchLower))
                    .limit(20)
                    .collect(Collectors.toList());
            } else {
                customers = customerRepository.findAll().stream()
                    .limit(20)
                    .collect(Collectors.toList());
            }

            List<CustomerDTO> dtos = customers.stream()
                .map(this::convertToCustomerDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Failed to search customers", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/products/create")
    public ResponseEntity<?> createProduct(@RequestBody ProductCreateRequest request) {
        try {
            log.info("Creating new product: {}", request.getName());

            nl.embediq.woocommerce.entity.Product product = new nl.embediq.woocommerce.entity.Product();
            product.setName(request.getName());

            // Generate SKU automatically if not provided
            String generatedSku;
            if (request.getSku() == null || request.getSku().trim().isEmpty()) {
                generatedSku = skuGeneratorService.generateUniqueSku();
                log.info("Generated SKU for product '{}': {}", request.getName(), generatedSku);
            } else {
                generatedSku = request.getSku();
                // Validate provided SKU
                final String skuToCheck = generatedSku;
                if (productRepository.findAll().stream().anyMatch(p -> skuToCheck.equals(p.getSku()))) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "SKU already exists: " + generatedSku
                    ));
                }
            }
            product.setSku(generatedSku);

            product.setPrice(request.getPrice());
            product.setRegularPrice(request.getPrice());
            product.setDescription(request.getDescription());
            product.setShortDescription(request.getShortDescription());

            // Set type based on whether it has variations
            if (request.getVariations() != null && !request.getVariations().isEmpty()) {
                product.setType("variable");
            } else {
                product.setType("simple");
            }

            product.setStatus("publish");
            product.setCreatedAt(LocalDateTime.now());

            product = productRepository.save(product);

            // Create variations if provided
            if (request.getVariations() != null && !request.getVariations().isEmpty()) {
                for (ProductVariationCreateRequest varReq : request.getVariations()) {
                    nl.embediq.woocommerce.entity.ProductVariation variation =
                        new nl.embediq.woocommerce.entity.ProductVariation();

                    variation.setProduct(product);
                    variation.setSku(skuGeneratorService.generateUniqueSku());
                    variation.setPrice(varReq.getPrice());
                    variation.setRegularPrice(varReq.getRegularPrice() != null ?
                        varReq.getRegularPrice() : varReq.getPrice());
                    variation.setSalePrice(varReq.getSalePrice());
                    variation.setDescription(varReq.getDescription());
                    variation.setAttributes(varReq.getAttributes());
                    variation.setWeight(varReq.getWeight());
                    variation.setDimensions(varReq.getDimensions());
                    variation.setStatus("publish");
                    variation.setCreatedAt(LocalDateTime.now());

                    product.getVariations().add(variation);
                }

                product = productRepository.save(product);
                log.info("Created {} variations for product ID: {}",
                    request.getVariations().size(), product.getId());
            }

            log.info("Product created successfully with ID: {} and SKU: {}",
                product.getId(), product.getSku());

            ProductDTO dto = convertToProductDTO(product);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "product", dto,
                "message", "Product created successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to create product", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/products/{productId}/variations")
    public ResponseEntity<?> addProductVariation(
            @PathVariable Long productId,
            @RequestBody ProductVariationCreateRequest request) {
        try {
            nl.embediq.woocommerce.entity.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

            nl.embediq.woocommerce.entity.ProductVariation variation =
                new nl.embediq.woocommerce.entity.ProductVariation();

            variation.setProduct(product);
            variation.setSku(skuGeneratorService.generateUniqueSku());
            variation.setPrice(request.getPrice());
            variation.setRegularPrice(request.getRegularPrice() != null ?
                request.getRegularPrice() : request.getPrice());
            variation.setSalePrice(request.getSalePrice());
            variation.setDescription(request.getDescription());
            variation.setAttributes(request.getAttributes());
            variation.setWeight(request.getWeight());
            variation.setDimensions(request.getDimensions());
            variation.setStatus("publish");
            variation.setCreatedAt(LocalDateTime.now());

            product.getVariations().add(variation);

            // Update product type to variable if it was simple
            if ("simple".equals(product.getType())) {
                product.setType("variable");
            }

            productRepository.save(product);

            log.info("Added variation to product ID: {}", productId);

            ProductVariationDTO dto = new ProductVariationDTO();
            dto.setId(variation.getId());
            dto.setSku(variation.getSku());
            dto.setPrice(variation.getPrice());
            dto.setRegularPrice(variation.getRegularPrice());
            dto.setSalePrice(variation.getSalePrice());
            dto.setDescription(variation.getDescription());
            dto.setAttributes(variation.getAttributes());
            dto.setWeight(variation.getWeight());
            dto.setDimensions(variation.getDimensions());
            dto.setStatus(variation.getStatus());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "variation", dto,
                "message", "Variation added successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to add variation", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long productId,
            @RequestBody ProductCreateRequest request) {
        try {
            nl.embediq.woocommerce.entity.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

            log.info("Updating product ID: {}", productId);

            // Update basic fields
            product.setName(request.getName());
            product.setPrice(request.getPrice());
            product.setRegularPrice(request.getPrice());
            product.setDescription(request.getDescription());
            product.setShortDescription(request.getShortDescription());

            // Only update SKU if provided and different
            if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
                final String newSku = request.getSku();
                // Check if SKU is taken by another product
                boolean skuTaken = productRepository.findAll().stream()
                    .anyMatch(p -> !p.getId().equals(productId) && newSku.equals(p.getSku()));

                if (skuTaken) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "SKU already exists: " + newSku
                    ));
                }
                product.setSku(newSku);
            }

            product = productRepository.save(product);

            log.info("Product updated successfully: {}", productId);

            ProductDTO dto = convertToProductDTO(product);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "product", dto,
                "message", "Product updated successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to update product", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/products/{productId}/variations/{variationId}")
    public ResponseEntity<?> deleteProductVariation(
            @PathVariable Long productId,
            @PathVariable Long variationId) {
        try {
            nl.embediq.woocommerce.entity.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

            // Remove variation from product
            product.getVariations().removeIf(v -> v.getId().equals(variationId));

            // Update product type if no variations left
            if (product.getVariations().isEmpty() && "variable".equals(product.getType())) {
                product.setType("simple");
            }

            productRepository.save(product);

            log.info("Variation {} removed from product {}", variationId, productId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Variation deleted successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to delete variation", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PatchMapping("/products/{productId}/status")
    public ResponseEntity<?> updateProductStatus(
            @PathVariable Long productId,
            @RequestBody Map<String, String> request) {
        try {
            nl.embediq.woocommerce.entity.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

            String newStatus = request.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Status is required"
                ));
            }

            // Update status
            product.setStatus(newStatus);
            productRepository.save(product);

            log.info("Product {} status updated to: {}", productId, newStatus);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product status updated successfully",
                "status", newStatus
            ));

        } catch (Exception e) {
            log.error("Failed to update product status", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

            // Only allow status change for manually created orders (no WooCommerce ID)
            if (order.getWooCommerceId() != null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Cannot change status of WooCommerce synced orders"
                ));
            }

            String newStatus = request.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Status is required"
                ));
            }

            // Parse and validate status
            try {
                nl.embediq.woocommerce.enums.OrderStatus orderStatus =
                    nl.embediq.woocommerce.enums.OrderStatus.valueOf(newStatus.toUpperCase());

                order.setStatus(orderStatus);
                orderRepository.save(order);

                log.info("Order {} status updated to: {}", orderId, newStatus);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Order status updated successfully",
                    "status", orderStatus.toString()
                ));

            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid status. Must be one of: PENDING, PROCESSING, ON_HOLD, COMPLETED, CANCELLED, REFUNDED, FAILED"
                ));
            }

        } catch (Exception e) {
            log.error("Failed to update order status", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // ==================== EXPENSES ENDPOINTS ====================

    @GetMapping("/expenses")
    public ResponseEntity<Page<ExpenseDTO>> getExpenses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String supplier,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("expenseDate").descending());

        List<nl.embediq.woocommerce.entity.Expense> allExpenses = expenseRepository.findAll();

        // Apply filters
        if (category != null && !category.isEmpty()) {
            allExpenses = allExpenses.stream()
                .filter(e -> e.getCategory().equalsIgnoreCase(category))
                .collect(Collectors.toList());
        }

        if (supplier != null && !supplier.isEmpty()) {
            allExpenses = allExpenses.stream()
                .filter(e -> e.getSupplier() != null &&
                           e.getSupplier().toLowerCase().contains(supplier.toLowerCase()))
                .collect(Collectors.toList());
        }

        if (dateFrom != null) {
            allExpenses = allExpenses.stream()
                .filter(e -> e.getExpenseDate().isAfter(dateFrom))
                .collect(Collectors.toList());
        }

        if (dateTo != null) {
            allExpenses = allExpenses.stream()
                .filter(e -> e.getExpenseDate().isBefore(dateTo))
                .collect(Collectors.toList());
        }

        // Convert to DTOs with pagination
        List<ExpenseDTO> expenseDTOs = allExpenses.stream()
            .sorted((e1, e2) -> e2.getExpenseDate().compareTo(e1.getExpenseDate()))
            .skip((long) page * size)
            .limit(size)
            .map(this::convertToExpenseDTO)
            .collect(Collectors.toList());

        long total = allExpenses.size();
        Page<ExpenseDTO> expensePage = new PageImpl<>(expenseDTOs, pageable, total);

        return ResponseEntity.ok(expensePage);
    }

    @GetMapping("/expenses/{id}")
    public ResponseEntity<ExpenseDTO> getExpenseById(@PathVariable Long id) {
        return expenseRepository.findById(id)
            .map(this::convertToExpenseDTO)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/expenses")
    public ResponseEntity<?> createExpense(@RequestBody ExpenseCreateRequest request) {
        try {
            log.info("Creating new expense: {}", request.getDescription());

            nl.embediq.woocommerce.entity.Expense expense = new nl.embediq.woocommerce.entity.Expense();
            expense.setDescription(request.getDescription());
            expense.setAmount(request.getAmount());
            expense.setCategory(request.getCategory());
            expense.setSupplier(request.getSupplier());
            expense.setNotes(request.getNotes());
            expense.setExpenseDate(request.getExpenseDate() != null ?
                request.getExpenseDate() : LocalDateTime.now());

            expense = expenseRepository.save(expense);

            log.info("Expense created successfully with ID: {}", expense.getId());

            ExpenseDTO dto = convertToExpenseDTO(expense);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "expense", dto,
                "message", "Expense created successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to create expense", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<?> updateExpense(
            @PathVariable Long id,
            @RequestBody ExpenseCreateRequest request) {
        try {
            nl.embediq.woocommerce.entity.Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

            log.info("Updating expense ID: {}", id);

            expense.setDescription(request.getDescription());
            expense.setAmount(request.getAmount());
            expense.setCategory(request.getCategory());
            expense.setSupplier(request.getSupplier());
            expense.setNotes(request.getNotes());
            if (request.getExpenseDate() != null) {
                expense.setExpenseDate(request.getExpenseDate());
            }

            expense = expenseRepository.save(expense);

            log.info("Expense updated successfully: {}", id);

            ExpenseDTO dto = convertToExpenseDTO(expense);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "expense", dto,
                "message", "Expense updated successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to update expense", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        try {
            if (!expenseRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            expenseRepository.deleteById(id);

            log.info("Expense deleted: {}", id);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Expense deleted successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to delete expense", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/expenses/categories")
    public ResponseEntity<List<String>> getExpenseCategories() {
        List<String> categories = expenseRepository.findDistinctCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/expenses/suppliers")
    public ResponseEntity<List<String>> getExpenseSuppliers() {
        List<String> suppliers = expenseRepository.findDistinctSuppliers();
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/expenses/stats")
    public ResponseEntity<Map<String, Object>> getExpenseStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo
    ) {
        List<nl.embediq.woocommerce.entity.Expense> expenses = expenseRepository.findAll();

        // Apply date filter
        if (dateFrom != null) {
            expenses = expenses.stream()
                .filter(e -> e.getExpenseDate().isAfter(dateFrom))
                .collect(Collectors.toList());
        }

        if (dateTo != null) {
            expenses = expenses.stream()
                .filter(e -> e.getExpenseDate().isBefore(dateTo))
                .collect(Collectors.toList());
        }

        // Calculate total
        BigDecimal totalExpenses = expenses.stream()
            .map(nl.embediq.woocommerce.entity.Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group by category
        Map<String, BigDecimal> byCategory = expenses.stream()
            .collect(Collectors.groupingBy(
                nl.embediq.woocommerce.entity.Expense::getCategory,
                Collectors.reducing(BigDecimal.ZERO,
                    nl.embediq.woocommerce.entity.Expense::getAmount,
                    BigDecimal::add)
            ));

        // Monthly expenses (last 6 months)
        Map<String, BigDecimal> monthlyExpenses = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i);
            LocalDateTime startOfMonth = month.withDayOfMonth(1).atStartOfDay();
            LocalDateTime endOfMonth = month.withDayOfMonth(month.lengthOfMonth()).atTime(23, 59, 59);

            BigDecimal monthTotal = expenses.stream()
                .filter(e -> e.getExpenseDate().isAfter(startOfMonth) &&
                           e.getExpenseDate().isBefore(endOfMonth))
                .map(nl.embediq.woocommerce.entity.Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyExpenses.put(month.toString().substring(0, 7), monthTotal);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalExpenses", totalExpenses);
        stats.put("expenseCount", expenses.size());
        stats.put("byCategory", byCategory);
        stats.put("monthlyExpenses", monthlyExpenses);

        return ResponseEntity.ok(stats);
    }

    private ExpenseDTO convertToExpenseDTO(nl.embediq.woocommerce.entity.Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setCategory(expense.getCategory());
        dto.setSupplier(expense.getSupplier());
        dto.setNotes(expense.getNotes());
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setCreatedAt(expense.getCreatedAt());
        dto.setUpdatedAt(expense.getUpdatedAt());
        return dto;
    }
}
