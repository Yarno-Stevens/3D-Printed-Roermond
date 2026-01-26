package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.Product;
import nl.embediq.woocommerce.entity.ProductVariation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariationRepository extends JpaRepository<ProductVariation, Long> {

    Optional<ProductVariation> findByWooCommerceId(Long wooCommerceId);

    List<ProductVariation> findByProduct(Product product);

    List<ProductVariation> findByProductId(Long productId);

    void deleteByProductAndWooCommerceIdNotIn(Product product, List<Long> keepIds);
}