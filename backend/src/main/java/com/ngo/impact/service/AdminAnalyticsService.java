package com.ngo.impact.service;

import com.ngo.impact.dto.AdminAnalyticsDTO;
import com.ngo.impact.dto.OrderDTO;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.entity.Campaign;
import com.ngo.impact.entity.User;
import com.ngo.impact.repository.CampaignRepository;
import com.ngo.impact.repository.OrderRepository;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final OrderService orderService;
    private final ProductService productService;

    public AdminAnalyticsDTO getAnalyticsOverview() {
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.countByRole(User.Role.CUSTOMER);
        long totalProducts = productRepository.count();
        long lowStockCount = productRepository.countByStockQuantityLessThan(10);
        long activeCampaigns = campaignRepository.findByStatus(Campaign.Status.ACTIVE).size();

        List<OrderDTO> recentOrders = orderRepository.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                .stream().map(orderService::mapToDTO).collect(Collectors.toList());

        List<ProductDTO> lowStockProducts = productRepository.findAll().stream()
                .filter(p -> p.getStockQuantity() < 10)
                .map(productService::mapToDTO)
                .limit(5)
                .collect(Collectors.toList());

        return AdminAnalyticsDTO.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalProducts(totalProducts)
                .lowStockProductsCount(lowStockCount)
                .activeCampaignsCount(activeCampaigns)
                .recentOrders(recentOrders)
                .lowStockProducts(lowStockProducts)
                .build();
    }
}
