package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.VariationAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VariationAttributeRepository extends JpaRepository<VariationAttribute, Long> {
    List<VariationAttribute> findByAttributeTypeAndActiveTrue(String attributeType);
    List<VariationAttribute> findByActiveTrue();
    List<VariationAttribute> findByAttributeTypeOrderBySortOrder(String attributeType);
}

