package com.ngo.impact.repository;

import com.ngo.impact.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Order> findByUserId(Long userId, Pageable pageable);

    List<Order> findByUserIdAndPaymentStatusInAndOrderStatusOrderByCreatedAtDesc(
            Long userId, List<Order.PaymentStatus> paymentStatuses, Order.OrderStatus orderStatus);

    /** Revenue = verified payments that were not cancelled or refunded. */
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.paymentStatus = 'PAID' " +
           "AND o.orderStatus <> 'CANCELLED'")
    BigDecimal sumTotalRevenue();

    long countByPaymentStatus(Order.PaymentStatus status);
    long countByOrderStatus(Order.OrderStatus status);

    @Query("SELECT o FROM Order o WHERE " +
           "(:orderStatus IS NULL OR o.orderStatus = :orderStatus) AND " +
           "(:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) AND " +
           "(:query IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(CONCAT(o.user.firstName, ' ', o.user.lastName)) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Order> searchAdmin(@Param("orderStatus") Order.OrderStatus orderStatus,
                            @Param("paymentStatus") Order.PaymentStatus paymentStatus,
                            @Param("query") String query,
                            Pageable pageable);

    /** Row lock so the checkout callback and the webhook cannot both process the same payment. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);
}
