package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ExpenseCreateRequest {
    private String description;
    private BigDecimal amount;
    private String category;
    private String supplier;
    private String notes;
    private LocalDateTime expenseDate;
}

