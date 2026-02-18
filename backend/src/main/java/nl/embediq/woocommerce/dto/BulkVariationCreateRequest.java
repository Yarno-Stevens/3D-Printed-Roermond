package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BulkVariationCreateRequest {
    private String variationType; // 'color', 'custom', etc.
    private List<Long> selectedAttributeIds; // For auto-generation from DB
    private List<ManualVariation> manualVariations; // For custom fields
    private BigDecimal basePrice;
    private String description;

    @Data
    public static class ManualVariation {
        private String attributeName;
        private String attributeValue;
        private BigDecimal price;
        private String description;
    }
}

