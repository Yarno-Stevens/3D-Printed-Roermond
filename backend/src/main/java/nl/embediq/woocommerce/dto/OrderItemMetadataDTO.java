package nl.embediq.woocommerce.dto;

import lombok.Data;

@Data
public class OrderItemMetadataDTO {
    private String key;
    private String displayKey;
    private String value;
    private String displayValue;
}

