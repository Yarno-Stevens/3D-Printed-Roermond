package nl.embediq.woocommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SyncResult {
    private boolean success;
    private int processedCount;
    private int failedCount;
    private String errorMessage;
}
