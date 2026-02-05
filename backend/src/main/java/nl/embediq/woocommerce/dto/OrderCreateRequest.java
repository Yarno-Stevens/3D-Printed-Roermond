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
    private String customerCompanyName;
    private String customerPhone;
    private String customerAddress;
    private String customerAddress2;
    private String customerCity;
    private String customerPostalCode;
    private String customerState;
    private String customerCountry;

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
