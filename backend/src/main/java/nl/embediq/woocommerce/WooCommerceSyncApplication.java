package nl.embediq.woocommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WooCommerceSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(WooCommerceSyncApplication.class, args);
    }
}
