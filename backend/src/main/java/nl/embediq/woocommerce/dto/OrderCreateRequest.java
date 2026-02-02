package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderCreateRequest {
    private Long customerId;
    private String customerEmail;
    private String customerFirstName;
    private String customerLastName;
    private List<OrderItemRequest> items;
    private String notes;

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private Long variationId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
    }
}

