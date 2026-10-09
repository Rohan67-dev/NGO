package com.ngo.impact.repository;

import com.ngo.impact.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlug(String slug);
    Optional<Product> findBySku(String sku);

    Page<Product> findByStatus(Product.Status status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProducts(@Param("status") Product.Status status,
                                 @Param("categoryId") Long categoryId,
                                 @Param("query") String query,
                                 Pageable pageable);

    List<Product> findByFeaturedTrueAndStatus(Product.Status status);
    
    long countByStockQuantityLessThan(Integer threshold);
}
