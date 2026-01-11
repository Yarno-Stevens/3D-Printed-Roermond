package nl.embediq.woocommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class WooCommerceRateLimitException extends RuntimeException {
    
    public WooCommerceRateLimitException(String message) {
        super(message);
    }
}
