package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductVariationDTO {
    private Long id;
    private Long wooCommerceId;
    private String sku;
    private BigDecimal price;
    private BigDecimal regularPrice;
    private BigDecimal salePrice;
    private String description;
    private String attributes;
    private String weight;
    private String dimensions;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastSyncedAt;
}

