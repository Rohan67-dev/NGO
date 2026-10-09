package com.ngo.impact.service;

import com.ngo.impact.dto.AdminAnalyticsDTO;
import com.ngo.impact.dto.OrderDTO;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.entity.Campaign;
import com.ngo.impact.entity.Order;
import com.ngo.impact.entity.Product;
import com.ngo.impact.entity.User;
import com.ngo.impact.repository.CampaignRepository;
import com.ngo.impact.repository.OrderRepository;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Dashboard figures, all computed from stored records. */
@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    static final int LOW_STOCK_THRESHOLD = 10;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final OrderService orderService;
    private final ProductService productService;
    private final ImpactService impactService;

    @Transactional(readOnly = true)
    public AdminAnalyticsDTO getAnalyticsOverview() {
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        // Archived (INACTIVE) products are not for sale, so they don't raise stock alerts.
        long lowStockCount = productRepository.countByStockQuantityLessThanAndStatusNot(LOW_STOCK_THRESHOLD, Product.Status.INACTIVE);
        List<ProductDTO> lowStockProducts = productRepository
                .findByStockQuantityLessThanAndStatusNotOrderByStockQuantityAsc(LOW_STOCK_THRESHOLD, Product.Status.INACTIVE, PageRequest.of(0, 5))
                .stream().map(productService::mapToDTO).collect(Collectors.toList());

        List<OrderDTO> recentOrders = orderRepository.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                .stream().map(orderService::mapToDTO).collect(Collectors.toList());

        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (Order.OrderStatus s : Order.OrderStatus.values()) {
            ordersByStatus.put(s.name(), orderRepository.countByOrderStatus(s));
        }

        // Paid but cancelled (e.g. stock ran out at payment time, or admin cancelled) => money must be returned.
        long refundsDue = orderRepository.findAll().stream()
                .filter(o -> o.getPaymentStatus() == Order.PaymentStatus.PAID && o.getOrderStatus() == Order.OrderStatus.CANCELLED)
                .count();

        return AdminAnalyticsDTO.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(orderRepository.count())
                .paidOrders(orderRepository.countByPaymentStatus(Order.PaymentStatus.PAID))
                .pendingPaymentOrders(orderRepository.countByPaymentStatus(Order.PaymentStatus.PENDING)
                        + orderRepository.countByPaymentStatus(Order.PaymentStatus.FAILED))
                .refundsDueCount(refundsDue)
                .ordersByStatus(ordersByStatus)
                .totalCustomers(userRepository.countByRole(User.Role.CUSTOMER))
                .totalProducts(productRepository.count())
                .lowStockProductsCount(lowStockCount)
                .lowStockThreshold(LOW_STOCK_THRESHOLD)
                .activeCampaignsCount((long) campaignRepository.findByStatus(Campaign.Status.ACTIVE).size())
                .newContactMessages(impactService.countNewContactMessages())
                .recentOrders(recentOrders)
                .lowStockProducts(lowStockProducts)
                .build();
    }
}
