package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CustomerDTO {
    private Long id;
    private Long wooCommerceId;
    private String email;
    private String firstName;
    private String lastName;
    private String companyName;
    private String phone;
    private String address;
    private String address2;
    private String city;
    private String postalCode;
    private String state;
    private String country;
    private LocalDateTime createdAt;
    private LocalDateTime lastSyncedAt;
}
