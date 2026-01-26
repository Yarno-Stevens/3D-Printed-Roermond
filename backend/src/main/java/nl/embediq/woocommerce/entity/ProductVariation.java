package nl.embediq.woocommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_variations")
@Data
public class ProductVariation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "woo_commerce_id", unique = true)
    private Long wooCommerceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "sku")
    private String sku;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "regular_price", precision = 10, scale = 2)
    private BigDecimal regularPrice;

    @Column(name = "sale_price", precision = 10, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "attributes", columnDefinition = "TEXT")
    private String attributes;

    @Column(name = "weight")
    private String weight;

    @Column(name = "dimensions", columnDefinition = "TEXT")
    private String dimensions;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = LocalDateTime.now();
    }
}