package nl.embediq.woocommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WooProduct {

    private Long id;
    private String name;
    private String slug;
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

    @JsonProperty("short_description")
    private String shortDescription;

    private List<WooImage> images;

    private List<WooCategory> categories;

    private List<WooTag> tags;

    private String type;
    private String status;

    @JsonProperty("total_sales")
    private Integer totalSales;

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
    public static class WooCategory {
        private Long id;
        private String name;
        private String slug;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WooTag {
        private Long id;
        private String name;
        private String slug;
    }
}