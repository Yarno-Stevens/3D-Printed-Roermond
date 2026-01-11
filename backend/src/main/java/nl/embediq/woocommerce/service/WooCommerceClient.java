package nl.embediq.woocommerce.service;

import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.WooCustomer;
import nl.embediq.woocommerce.dto.WooOrder;
import nl.embediq.woocommerce.exception.WooCommerceApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
public class WooCommerceClient {
    
    @Autowired
    private RestTemplate wooCommerceRestTemplate;
    
    @Value("${woocommerce.url}")
    private String baseUrl;
    
    @Value("${woocommerce.consumer-key}")
    private String consumerKey;
    
    @Value("${woocommerce.consumer-secret}")
    private String consumerSecret;
    
    @Value("${woocommerce.sync.per-page}")
    private int perPage;
    
    public List<WooOrder> getOrders(int page, LocalDateTime modifiedAfter) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/wp-json/wc/v3/orders")
                .queryParam("page", page)
                .queryParam("per_page", perPage)
                .queryParam("orderby", "modified")
                .queryParam("order", "asc");
            
            if (modifiedAfter != null) {
                builder.queryParam("modified_after", 
                    modifiedAfter.format(DateTimeFormatter.ISO_DATE_TIME));
            }
            
            String url = builder.toUriString();
            
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            log.debug("Fetching orders from WooCommerce: page={}, modifiedAfter={}", 
                page, modifiedAfter);
            
            ResponseEntity<WooOrder[]> response = wooCommerceRestTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                WooOrder[].class
            );
            
            List<WooOrder> orders = Arrays.asList(response.getBody());
            log.debug("Received {} orders from page {}", orders.size(), page);
            
            return orders;
            
        } catch (Exception e) {
            log.error("Error fetching orders from WooCommerce: page={}", page, e);
            throw new WooCommerceApiException("Failed to fetch orders", e);
        }
    }
    
    public List<WooCustomer> getCustomers(int page, LocalDateTime modifiedAfter) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/wp-json/wc/v3/customers")
                .queryParam("page", page)
                .queryParam("per_page", perPage)
                .queryParam("orderby", "modified")
                .queryParam("order", "asc");
            
            if (modifiedAfter != null) {
                builder.queryParam("modified_after", 
                    modifiedAfter.format(DateTimeFormatter.ISO_DATE_TIME));
            }
            
            String url = builder.toUriString();
            
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            log.debug("Fetching customers from WooCommerce: page={}", page);
            
            ResponseEntity<WooCustomer[]> response = wooCommerceRestTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                WooCustomer[].class
            );
            
            List<WooCustomer> customers = Arrays.asList(response.getBody());
            log.debug("Received {} customers from page {}", customers.size(), page);
            
            return customers;
            
        } catch (Exception e) {
            log.error("Error fetching customers from WooCommerce: page={}", page, e);
            throw new WooCommerceApiException("Failed to fetch customers", e);
        }
    }
    
    private HttpHeaders createAuthHeaders() {
        String auth = consumerKey + ":" + consumerSecret;
        byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
        String authHeader = "Basic " + new String(encodedAuth);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        return headers;
    }
}
