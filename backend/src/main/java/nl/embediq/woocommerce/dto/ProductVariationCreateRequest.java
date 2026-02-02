package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductVariationCreateRequest {
    private String attributes; // JSON string with variation attributes
    private BigDecimal price;
    private BigDecimal regularPrice;
    private BigDecimal salePrice;
    private String description;
    private String weight;
    private String dimensions;
}

