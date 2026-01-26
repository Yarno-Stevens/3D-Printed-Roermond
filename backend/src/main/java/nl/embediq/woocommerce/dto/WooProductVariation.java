package nl.embediq.woocommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WooProductVariation {

    private Long id;
    private String sku;
    private String price;

    @JsonProperty("regular_price")
    private String regularPrice;

    @JsonProperty("sale_price")
    private String salePrice;

    @JsonProperty("stock_status")
    private String stockStatus;

    @JsonProperty("stock_quantity")
    private Integer stockQuantity;

    @JsonProperty("manage_stock")
    private Boolean manageStock;

    private String description;

    private WooImage image;

    private List<WooAttribute> attributes;

    private String weight;

    private WooDimensions dimensions;

    private String status;

    @JsonProperty("date_created")
    private String dateCreated;

    @JsonProperty("date_modified")
    private String dateModified;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WooImage {
        private Long id;
        private String src;
        private String name;
        private String alt;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WooAttribute {
        private Long id;
        private String name;
        private String option;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WooDimensions {
        private String length;
        private String width;
        private String height;
    }
}