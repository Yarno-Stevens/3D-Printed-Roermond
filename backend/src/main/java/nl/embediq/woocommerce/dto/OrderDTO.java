package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class OrderDTO {
    private Long id;
    private Long wooCommerceId;
    private String orderNumber;
    private String status;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private LocalDateTime syncedAt;
    private CustomerDTO customer;
    private Integer itemsCount;
    private List<OrderItemDTO> items = new ArrayList<>();
}
