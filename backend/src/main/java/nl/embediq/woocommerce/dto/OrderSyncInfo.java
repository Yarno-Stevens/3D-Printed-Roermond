package nl.embediq.woocommerce.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderSyncInfo {
    private String orderNumber;
    private Long wooCommerceId;
    private String status;
    private BigDecimal total;
    private String customerName;
    private LocalDateTime syncedAt;
    private LocalDateTime createdAt;
}
