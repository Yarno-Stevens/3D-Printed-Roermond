package nl.embediq.woocommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WooLineItem {
    
    private Long id;
    
    private String name;
    
    @JsonProperty("product_id")
    private Long productId;
    
    private Integer quantity;
    
    private String total;
}
