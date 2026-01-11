package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    Optional<Customer> findByWooCommerceId(Long wooCommerceId);
    
    Optional<Customer> findByEmail(String email);
}
