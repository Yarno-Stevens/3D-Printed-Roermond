package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class ProductDTO {
    private Long id;
    private Long wooCommerceId;
    private String name;
    private String sku;
    private BigDecimal price;
    private BigDecimal regularPrice;
    private BigDecimal salePrice;
    private String description;
    private String shortDescription;
    private String type;
    private String status;
    private Integer stockQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime lastSyncedAt;
    private List<ProductVariationDTO> variations = new ArrayList<>();
}
