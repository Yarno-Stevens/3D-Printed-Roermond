package nl.embediq.woocommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class WooCommerceApiException extends RuntimeException {
    
    public WooCommerceApiException(String message) {
        super(message);
    }
    
    public WooCommerceApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
