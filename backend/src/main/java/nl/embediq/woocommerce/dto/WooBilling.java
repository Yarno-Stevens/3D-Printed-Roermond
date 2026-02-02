package nl.embediq.woocommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WooBilling {
    
    @JsonProperty("first_name")
    private String firstName;
    
    @JsonProperty("last_name")
    private String lastName;
    
    private String company;

    private String email;
    
    private String phone;
    
    @JsonProperty("address_1")
    private String address1;
    
    @JsonProperty("address_2")
    private String address2;
    
    private String city;
    
    private String postcode;
    
    private String country;
    
    private String state;
}
