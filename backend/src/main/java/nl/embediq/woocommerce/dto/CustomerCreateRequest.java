package nl.embediq.woocommerce.dto;

import lombok.Data;

@Data
public class CustomerCreateRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String companyName;
    private String phone;
    private String address;
    private String city;
    private String postalCode;
    private String state;
    private String country;
}

