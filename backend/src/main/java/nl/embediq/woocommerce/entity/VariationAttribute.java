package nl.embediq.woocommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "variation_attributes")
@Data
public class VariationAttribute {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "attribute_type", nullable = false, length = 50)
    private String attributeType;
    
    @Column(name = "attribute_name", nullable = false, length = 100)
    private String attributeName;
    
    @Column(name = "attribute_value", nullable = false, length = 100)
    private String attributeValue;
    
    @Column(name = "hex_code", length = 7)
    private String hexCode;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "active")
    private Boolean active = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
