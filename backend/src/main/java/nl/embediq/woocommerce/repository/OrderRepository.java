package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByWooCommerceId(Long wooCommerceId);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.lastSyncedAt > :since")
    Long countSyncedSince(@Param("since") LocalDateTime since);
}
