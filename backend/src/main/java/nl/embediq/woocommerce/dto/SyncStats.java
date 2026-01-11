package nl.embediq.woocommerce.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class SyncStats {
    private Map<String, Long> ordersByStatus;
    private Map<String, Long> ordersPerDay;
    private List<CustomerStats> topCustomers;
}
