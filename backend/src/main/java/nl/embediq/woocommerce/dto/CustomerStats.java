package nl.embediq.woocommerce.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CustomerStats {
    private String name;
    private String email;
    private Integer orderCount;
    private BigDecimal totalSpent;
}
