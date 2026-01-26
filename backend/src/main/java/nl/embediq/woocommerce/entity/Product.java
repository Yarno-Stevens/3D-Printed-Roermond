package nl.embediq.woocommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "woo_commerce_id", unique = true)
    private Long wooCommerceId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug")
    private String slug;

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

    @Column(name = "short_description", columnDefinition = "TEXT")
    private String shortDescription;

    @Column(name = "type")
    private String type;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariation> variations = new ArrayList<>();

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

    public void addVariation(ProductVariation variation) {
        variations.add(variation);
        variation.setProduct(this);
    }

    public void removeVariation(ProductVariation variation) {
        variations.remove(variation);
        variation.setProduct(null);
    }
}