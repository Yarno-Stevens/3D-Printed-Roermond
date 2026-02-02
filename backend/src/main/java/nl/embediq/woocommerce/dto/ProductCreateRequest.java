package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ProductCreateRequest {
    private String name;
    private String sku;
    private BigDecimal price;
    private String description;
    private String shortDescription;
    private List<ProductVariationCreateRequest> variations = new ArrayList<>();
}

