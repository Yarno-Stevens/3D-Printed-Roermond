package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    Optional<Customer> findByWooCommerceId(Long wooCommerceId);
    
    Optional<Customer> findByEmail(String email);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt >= :since")
    Long countSyncedSince(@Param("since") LocalDateTime since);
}
