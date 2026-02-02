package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByWooCommerceId(Long wooCommerceId);

    Optional<Product> findBySku(String sku);

    Page<Product> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.createdAt >= :since")
    Long countSyncedSince(@Param("since") LocalDateTime since);
}