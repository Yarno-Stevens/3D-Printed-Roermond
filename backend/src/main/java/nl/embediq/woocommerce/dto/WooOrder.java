package nl.embediq.woocommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WooOrder {
    
    private Long id;
    
    @JsonProperty("order_key")
    private String orderKey;
    
    @JsonProperty("number")
    private String orderNumber;
    
    private String status;
    
    private String total;
    
    @JsonProperty("customer_id")
    private Long customerId;
    
    @JsonProperty("date_created")
    private String dateCreated;
    
    @JsonProperty("date_modified")
    private String dateModified;
    
    @JsonProperty("line_items")
    private List<WooLineItem> lineItems;
    
    private WooBilling billing;
}
