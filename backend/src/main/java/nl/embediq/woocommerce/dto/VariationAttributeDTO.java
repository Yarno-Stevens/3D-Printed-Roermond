package nl.embediq.woocommerce.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VariationAttributeDTO {
    private Long id;
    private String attributeType;
    private String attributeName;
    private String attributeValue;
    private String hexCode;
    private Integer sortOrder;
    private Boolean active;
    private LocalDateTime createdAt;
}
