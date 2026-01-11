package nl.embediq.woocommerce.config;

import nl.embediq.woocommerce.exception.WooCommerceApiException;
import nl.embediq.woocommerce.exception.WooCommerceRateLimitException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

@Configuration
public class WooCommerceConfig {
    
    @Value("${woocommerce.url}")
    private String baseUrl;
    
    @Value("${woocommerce.consumer-key}")
    private String consumerKey;
    
    @Value("${woocommerce.consumer-secret}")
    private String consumerSecret;
    
    @Bean
    public RestTemplate wooCommerceRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setErrorHandler(new WooCommerceErrorHandler());
        return restTemplate;
    }
    
    public static class WooCommerceErrorHandler implements ResponseErrorHandler {
        
        @Override
        public boolean hasError(ClientHttpResponse response) throws IOException {
            return response.getStatusCode().is4xxClientError() 
                || response.getStatusCode().is5xxServerError();
        }
        
        @Override
        public void handleError(ClientHttpResponse response) throws IOException {
            if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new WooCommerceRateLimitException("Rate limit exceeded");
            }
            throw new WooCommerceApiException(
                "WooCommerce API error: " + response.getStatusCode(),
                null
            );
        }
    }
}
