package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsDTO {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalCustomers;
    private Long totalProducts;
    private Long lowStockProductsCount;
    private Long activeCampaignsCount;
    private List<ProductDTO> lowStockProducts;
    private List<OrderDTO> recentOrders;
}
