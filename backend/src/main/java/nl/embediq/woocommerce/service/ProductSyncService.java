package nl.embediq.woocommerce.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.SyncResult;
import nl.embediq.woocommerce.dto.WooProduct;
import nl.embediq.woocommerce.dto.WooProductVariation;
import nl.embediq.woocommerce.entity.Product;
import nl.embediq.woocommerce.entity.ProductVariation;
import nl.embediq.woocommerce.entity.SyncStatus;
import nl.embediq.woocommerce.enums.SyncStatusEnum;
import nl.embediq.woocommerce.enums.SyncType;
import nl.embediq.woocommerce.repository.ProductRepository;
import nl.embediq.woocommerce.repository.ProductVariationRepository;
import nl.embediq.woocommerce.repository.SyncStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ProductSyncService {

    @Autowired
    private WooCommerceClient wooCommerceClient;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariationRepository variationRepository;

    @Autowired
    private SyncStatusRepository syncStatusRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${woocommerce.sync.rate-limit-ms}")
    private long rateLimitMs;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    @Transactional
    public SyncResult syncProducts() {
        log.info("Starting product sync...");

        SyncStatus syncStatus = getOrCreateSyncStatus(SyncType.PRODUCT);
        syncStatus.setStatus(SyncStatusEnum.RUNNING);
        syncStatus.setLastAttemptedSync(LocalDateTime.now());
        syncStatus = syncStatusRepository.save(syncStatus);

        int processedCount = 0;
        int failedCount = 0;
        int page = syncStatus.getLastProcessedPage() != null
                ? syncStatus.getLastProcessedPage() + 1
                : 1;

        try {
            LocalDateTime modifiedAfter = syncStatus.getLastSuccessfulSync();

            while (true) {
                List<WooProduct> wooProducts =
                        wooCommerceClient.getProducts(page, modifiedAfter);

                if (wooProducts.isEmpty()) {
                    break;
                }

                for (WooProduct wooProduct : wooProducts) {
                    try {
                        processProduct(wooProduct);
                        processedCount++;
                    } catch (Exception e) {
                        log.error("Failed to process product {}",
                                wooProduct.getId(), e);
                        failedCount++;
                        entityManager.clear();
                    }
                }

                syncStatus.setLastProcessedPage(page);
                syncStatus.setTotalRecordsProcessed(processedCount);
                syncStatus.setFailedRecords(failedCount);
                syncStatusRepository.save(syncStatus);

                if (wooProducts.size() < 100) {
                    break;
                }

                page++;
                Thread.sleep(rateLimitMs);
            }

            syncStatus.setStatus(SyncStatusEnum.SUCCESS);
            syncStatus.setLastSuccessfulSync(LocalDateTime.now());
            syncStatus.setLastProcessedPage(null);
            syncStatus.setErrorMessage(null);
            syncStatusRepository.save(syncStatus);

            log.info("Product sync completed: processed={}, failed={}",
                    processedCount, failedCount);

            return new SyncResult(true, processedCount, failedCount, null);

        } catch (Exception e) {
            log.error("Product sync failed", e);

            syncStatus.setStatus(SyncStatusEnum.FAILED);
            syncStatus.setErrorMessage(e.getMessage());
            syncStatusRepository.save(syncStatus);

            return new SyncResult(false, processedCount, failedCount, e.getMessage());
        }
    }

    @Transactional
    public void processProduct(WooProduct wooProduct) throws JsonProcessingException {
        Product product = productRepository.findByWooCommerceId(wooProduct.getId())
                .orElse(new Product());

        boolean isNew = product.getId() == null;

        LocalDateTime wooModified = null;
        if (wooProduct.getDateModified() != null) {
            wooModified = LocalDateTime.parse(wooProduct.getDateModified(), ISO_FORMATTER);
        }

        if (isNew || (wooModified != null &&
                (product.getModifiedAt() == null || wooModified.isAfter(product.getModifiedAt())))) {

            log.info("Updating product {} ({})", wooProduct.getId(),
                    isNew ? "NEW" : "MODIFIED");

            updateProductFields(product, wooProduct);
            product = productRepository.save(product);

            if ("variable".equalsIgnoreCase(wooProduct.getType())) {
                syncProductVariations(product);
            }
        } else {
            log.debug("Skipping product {} - not modified", wooProduct.getId());
            product.setLastSyncedAt(LocalDateTime.now());
            productRepository.save(product);
        }
    }

    private void updateProductFields(Product product, WooProduct wooProduct) {
        product.setWooCommerceId(wooProduct.getId());
        product.setName(wooProduct.getName());
        product.setSlug(wooProduct.getSlug());
        product.setSku(wooProduct.getSku());

        product.setPrice(parsePrice(wooProduct.getPrice()));
        product.setRegularPrice(parsePrice(wooProduct.getRegularPrice()));
        product.setSalePrice(parsePrice(wooProduct.getSalePrice()));

        product.setDescription(stripHtml(wooProduct.getDescription()));
        product.setShortDescription(stripHtml(wooProduct.getShortDescription()));

        product.setType(wooProduct.getType());
        product.setStatus(wooProduct.getStatus());

        if (wooProduct.getDateCreated() != null) {
            product.setCreatedAt(LocalDateTime.parse(
                    wooProduct.getDateCreated(), ISO_FORMATTER));
        }
        if (wooProduct.getDateModified() != null) {
            product.setModifiedAt(LocalDateTime.parse(
                    wooProduct.getDateModified(), ISO_FORMATTER));
        }

        product.setLastSyncedAt(LocalDateTime.now());
    }

    @Transactional
    public void syncProductVariations(Product product) {
        try {
            log.info("Syncing variations for product {}", product.getWooCommerceId());

            List<WooProductVariation> wooVariations =
                    wooCommerceClient.getProductVariations(product.getWooCommerceId());

            if (wooVariations.isEmpty()) {
                log.debug("No variations found for product {}", product.getWooCommerceId());
                return;
            }

            List<Long> processedVariationIds = new ArrayList<>();

            for (WooProductVariation wooVariation : wooVariations) {
                try {
                    processVariation(product, wooVariation);
                    processedVariationIds.add(wooVariation.getId());
                } catch (Exception e) {
                    log.error("Failed to process variation {} for product {}",
                            wooVariation.getId(), product.getWooCommerceId(), e);
                }
            }

            if (!processedVariationIds.isEmpty()) {
                List<ProductVariation> existingVariations =
                        variationRepository.findByProduct(product);

                for (ProductVariation existing : existingVariations) {
                    if (!processedVariationIds.contains(existing.getWooCommerceId())) {
                        log.info("Deleting removed variation {} from product {}",
                                existing.getWooCommerceId(), product.getWooCommerceId());
                        variationRepository.delete(existing);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error syncing variations for product {}",
                    product.getWooCommerceId(), e);
        }
    }

    private void processVariation(Product product, WooProductVariation wooVariation)
            throws JsonProcessingException {

        ProductVariation variation = variationRepository
                .findByWooCommerceId(wooVariation.getId())
                .orElse(new ProductVariation());

        boolean isNew = variation.getId() == null;

        LocalDateTime wooModified = null;
        if (wooVariation.getDateModified() != null) {
            wooModified = LocalDateTime.parse(wooVariation.getDateModified(), ISO_FORMATTER);
        }

        if (isNew || (wooModified != null &&
                (variation.getModifiedAt() == null || wooModified.isAfter(variation.getModifiedAt())))) {

            log.info("Updating variation {} ({})", wooVariation.getId(),
                    isNew ? "NEW" : "MODIFIED");

            variation.setWooCommerceId(wooVariation.getId());
            variation.setProduct(product);
            variation.setSku(wooVariation.getSku());

            variation.setPrice(parsePrice(wooVariation.getPrice()));
            variation.setRegularPrice(parsePrice(wooVariation.getRegularPrice()));
            variation.setSalePrice(parsePrice(wooVariation.getSalePrice()));

            variation.setDescription(stripHtml(wooVariation.getDescription()));

            if (wooVariation.getAttributes() != null) {
                variation.setAttributes(objectMapper.writeValueAsString(
                        wooVariation.getAttributes()));
            }

            variation.setWeight(wooVariation.getWeight());

            if (wooVariation.getDimensions() != null) {
                variation.setDimensions(objectMapper.writeValueAsString(
                        wooVariation.getDimensions()));
            }

            variation.setStatus(wooVariation.getStatus());

            if (wooVariation.getDateCreated() != null) {
                variation.setCreatedAt(LocalDateTime.parse(
                        wooVariation.getDateCreated(), ISO_FORMATTER));
            }
            if (wooVariation.getDateModified() != null) {
                variation.setModifiedAt(LocalDateTime.parse(
                        wooVariation.getDateModified(), ISO_FORMATTER));
            }

            variation.setLastSyncedAt(LocalDateTime.now());

            variationRepository.save(variation);
        } else {
            log.debug("Skipping variation {} - not modified", wooVariation.getId());
            variation.setLastSyncedAt(LocalDateTime.now());
            variationRepository.save(variation);
        }
    }

    private BigDecimal parsePrice(String price) {
        if (price == null || price.isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(price);
        } catch (NumberFormatException e) {
            log.warn("Failed to parse price: {}", price);
            return BigDecimal.ZERO;
        }
    }

    private String stripHtml(String html) {
        if (html == null) {
            return null;
        }
        return html.replaceAll("<[^>]*>", "").trim();
    }

    private SyncStatus getOrCreateSyncStatus(SyncType syncType) {
        return syncStatusRepository.findBySyncType(syncType)
                .orElseGet(() -> {
                    SyncStatus status = new SyncStatus();
                    status.setSyncType(syncType);
                    status.setStatus(SyncStatusEnum.SUCCESS);
                    return status;
                });
    }
}