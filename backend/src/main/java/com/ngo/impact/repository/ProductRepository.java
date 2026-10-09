package com.ngo.impact.repository;

import com.ngo.impact.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlug(String slug);
    Optional<Product> findBySku(String sku);

    Page<Product> findByStatus(Product.Status status, Pageable pageable);

    /**
     * Storefront search. Price filters apply to the effective price (discount price when present).
     */
    @Query("SELECT p FROM Product p WHERE p.status IN :statuses AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(p.material) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:minPrice IS NULL OR COALESCE(p.discountPrice, p.price) >= :minPrice) AND " +
           "(:maxPrice IS NULL OR COALESCE(p.discountPrice, p.price) <= :maxPrice) AND " +
           "(:inStockOnly = FALSE OR p.stockQuantity > 0)")
    Page<Product> searchProducts(@Param("statuses") Collection<Product.Status> statuses,
                                 @Param("categoryId") Long categoryId,
                                 @Param("query") String query,
                                 @Param("minPrice") BigDecimal minPrice,
                                 @Param("maxPrice") BigDecimal maxPrice,
                                 @Param("inStockOnly") boolean inStockOnly,
                                 Pageable pageable);

    List<Product> findByFeaturedTrueAndStatus(Product.Status status);

    List<Product> findByCategoryIdAndStatusAndIdNot(Long categoryId, Product.Status status, Long id, Pageable pageable);

    long countByStockQuantityLessThan(Integer threshold);

    long countByCategoryId(Long categoryId);

    long countByCategoryIdAndStatus(Long categoryId, Product.Status status);

    List<Product> findByStockQuantityLessThanAndStatusNotOrderByStockQuantityAsc(Integer threshold, Product.Status status, Pageable pageable);

    long countByStockQuantityLessThanAndStatusNot(Integer threshold, Product.Status status);

    /** Row lock used when decrementing / restoring inventory so concurrent payments cannot oversell. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
