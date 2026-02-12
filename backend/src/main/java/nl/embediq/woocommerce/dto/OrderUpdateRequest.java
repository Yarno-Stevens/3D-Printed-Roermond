package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderUpdateRequest {
    private Long orderId;
    private Long customerId;
    private List<OrderItemRequest> items;
    private String status;

    @Data
    public static class OrderItemRequest {
        private Long id; // Voor bestaande items
        private Long productId;
        private Long variationId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
    }
}

