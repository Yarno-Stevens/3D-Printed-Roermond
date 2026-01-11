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
    
    @Scheduled(cron = "${woocommerce.sync.cron}")
    public void syncWooCommerceData() {
        log.info("=== Starting WooCommerce synchronization ===");
        
        try {
            // First sync customers (orders depend on them)
            SyncResult customerResult = customerSyncService.syncCustomers();
            log.info("Customer sync result: {}", customerResult);
            
            // Then sync orders
            SyncResult orderResult = orderSyncService.syncOrders();
            log.info("Order sync result: {}", orderResult);
            
            log.info("=== WooCommerce synchronization completed ===");
            
        } catch (Exception e) {
            log.error("Fatal error during WooCommerce sync", e);
        }
    }
}
