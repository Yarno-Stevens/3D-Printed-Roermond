package nl.embediq.woocommerce.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.entity.Product;
import nl.embediq.woocommerce.entity.ProductVariation;
import nl.embediq.woocommerce.entity.VariationAttribute;
import nl.embediq.woocommerce.repository.ProductVariationRepository;
import nl.embediq.woocommerce.repository.VariationAttributeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ColorVariationService {

    @Autowired
    private VariationAttributeRepository variationAttributeRepository;

    @Autowired
    private ProductVariationRepository productVariationRepository;

    @Autowired
    private SkuGeneratorService skuGeneratorService;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public void syncProductColorVariations(Product product) {
        try {
            log.info("Syncing color variations for product {}", product.getId());

            // Get all active color attributes
            List<VariationAttribute> colors = variationAttributeRepository
                    .findByAttributeTypeAndActiveTrue("color");

            if (colors.isEmpty()) {
                log.warn("No active colors found in variation_attributes table");
                return;
            }

            // Get existing variations for this product
            List<ProductVariation> existingVariations = productVariationRepository
                    .findByProduct(product);

            log.info("Found {} active colors, {} existing variations",
                    colors.size(), existingVariations.size());

            for (VariationAttribute color : colors) {
                // Check if variation with this color already exists
                boolean exists = existingVariations.stream()
                        .anyMatch(v -> {
                            try {
                                if (v.getAttributes() == null) return false;
                                Map<String, Object> attrs = objectMapper.readValue(
                                        v.getAttributes(), Map.class);
                                return color.getAttributeValue().equals(attrs.get("color"));
                            } catch (Exception e) {
                                return false;
                            }
                        });

                if (!exists) {
                    createColorVariation(product, color);
                }
            }

            log.info("Completed syncing color variations for product {}", product.getId());

        } catch (Exception e) {
            log.error("Error syncing color variations for product {}", product.getId(), e);
            throw new RuntimeException("Failed to sync color variations", e);
        }
    }

    private void createColorVariation(Product product, VariationAttribute color) {
        try {
            ProductVariation variation = new ProductVariation();
            variation.setProduct(product);
            variation.setSku(skuGeneratorService.generateUniqueSku());
            variation.setPrice(product.getPrice());
            variation.setRegularPrice(product.getRegularPrice());
            variation.setSalePrice(product.getSalePrice());
            variation.setDescription(String.format("%s - %s",
                    product.getName(), color.getAttributeName()));

            // Create attributes JSON
            Map<String, Object> attributes = Map.of(
                    "color", color.getAttributeValue(),
                    "color_name", color.getAttributeName(),
                    "hex_code", color.getHexCode() != null ? color.getHexCode() : ""
            );
            variation.setAttributes(objectMapper.writeValueAsString(attributes));

            variation.setStatus("publish");

            productVariationRepository.save(variation);

            log.info("Created color variation for product {} with color {} (SKU: {})",
                    product.getId(), color.getAttributeName(), variation.getSku());

        } catch (JsonProcessingException e) {
            log.error("Error creating color variation for product {} with color {}",
                    product.getId(), color.getAttributeName(), e);
        }
    }
}


