package nl.embediq.woocommerce.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkuGeneratorService {

    private final ProductRepository productRepository;
    private static final String SKU_PREFIX = "3DP";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");
    private static final Random RANDOM = new Random();

    /**
     * Generates a unique SKU for a product
     * Format: 3DP-YYMMDD-XXXX
     * Example: 3DP-260201-A3F2
     */
    public String generateUniqueSku() {
        String sku;
        int attempts = 0;
        int maxAttempts = 100;

        do {
            sku = generateSku();
            attempts++;

            if (attempts > maxAttempts) {
                // Fallback to timestamp-based SKU if too many collisions
                sku = generateTimestampBasedSku();
                log.warn("Generated timestamp-based SKU after {} attempts: {}", attempts, sku);
                break;
            }
        } while (skuExists(sku));

        log.info("Generated unique SKU: {} (attempts: {})", sku, attempts);
        return sku;
    }

    /**
     * Generates a SKU with format: 3DP-YYMMDD-XXXX
     * where XXXX is a random alphanumeric code
     */
    private String generateSku() {
        String datePart = LocalDateTime.now().format(DATE_FORMATTER);
        String randomPart = generateRandomCode(4);
        return String.format("%s-%s-%s", SKU_PREFIX, datePart, randomPart);
    }

    /**
     * Generates a timestamp-based SKU as fallback
     * Format: 3DP-TIMESTAMP
     */
    private String generateTimestampBasedSku() {
        long timestamp = System.currentTimeMillis() / 1000; // Unix timestamp
        return String.format("%s-%d", SKU_PREFIX, timestamp);
    }

    /**
     * Generates a random alphanumeric code
     */
    private String generateRandomCode(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            code.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }

        return code.toString();
    }

    /**
     * Checks if a SKU already exists in the database
     */
    private boolean skuExists(String sku) {
        return productRepository.findAll().stream()
                .anyMatch(p -> sku.equals(p.getSku()));
    }

    /**
     * Validates if a SKU follows the expected format
     */
    public boolean isValidSkuFormat(String sku) {
        if (sku == null || sku.isEmpty()) {
            return false;
        }

        // Match pattern: 3DP-YYMMDD-XXXX or 3DP-timestamp
        return sku.matches("^3DP-\\d{6}-[A-Z0-9]{4}$") ||
               sku.matches("^3DP-\\d+$");
    }
}

