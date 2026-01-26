package nl.embediq.woocommerce.service;

import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.SyncResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
@ConditionalOnProperty(
        value = "woocommerce.sync.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class WooCommerceSyncScheduler {

    @Autowired
    private CustomerSyncService customerSyncService;

    @Autowired
    private OrderSyncService orderSyncService;

    @Autowired
    private ProductSyncService productSyncService;  // ← NIEUW!

    @Scheduled(cron = "${woocommerce.sync.cron}")
    public void syncWooCommerceData() {
        log.info("=== Starting WooCommerce synchronization ===");

        try {
            // First sync products (orders kunnen naar SKU's refereren)
            log.info("📦 Syncing products...");
            SyncResult productResult = productSyncService.syncProducts();
            log.info("Product sync result: {}", productResult);

            // Then sync customers (orders depend on them)
            log.info("📊 Syncing customers...");
            SyncResult customerResult = customerSyncService.syncCustomers();
            log.info("Customer sync result: {}", customerResult);

            // Then sync orders
            log.info("🛒 Syncing orders...");
            SyncResult orderResult = orderSyncService.syncOrders();
            log.info("Order sync result: {}", orderResult);

            log.info("=== WooCommerce synchronization completed ===");

        } catch (Exception e) {
            log.error("Fatal error during WooCommerce sync", e);
        }
    }
}