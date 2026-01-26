package nl.embediq.woocommerce.dto;

import lombok.Data;
import nl.embediq.woocommerce.entity.SyncStatus;

import java.time.LocalDateTime;

@Data
public class SyncDashboard {
    private SyncStatus orderSync;
    private SyncStatus customerSync;
    private SyncStatus productSync;
    private Long totalOrders;
    private Long totalCustomers;
    private Long totalProducts;
    private Long ordersSyncedToday;
    private Long customersSyncedToday;
    private Long productsSyncedToday;
    private LocalDateTime lastUpdate;
}
