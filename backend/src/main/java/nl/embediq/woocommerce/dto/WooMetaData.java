package nl.embediq.woocommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WooMetaData {

    private Long id;

    private String key;

    private Object value;

    @JsonProperty("display_key")
    private String displayKey;

    @JsonProperty("display_value")
    private Object displayValue;
}

