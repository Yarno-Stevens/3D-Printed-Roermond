package nl.embediq.woocommerce.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class OrderItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal total;
    private List<OrderItemMetadataDTO> metadata = new ArrayList<>();
}