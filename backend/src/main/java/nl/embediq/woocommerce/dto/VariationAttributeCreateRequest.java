package nl.embediq.woocommerce.dto;

import lombok.Data;

@Data
public class VariationAttributeCreateRequest {
    private String attributeName;
    private String attributeValue;
    private String hexCode;
    private Integer sortOrder;
}

