package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsDTO {
    /** Sum of totals of PAID orders that were not cancelled. */
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long paidOrders;
    private Long pendingPaymentOrders;
    /** Orders that were paid and then cancelled: a refund must be issued in the payment provider. */
    private Long refundsDueCount;
    private Map<String, Long> ordersByStatus;
    private Long totalCustomers;
    private Long totalProducts;
    private Long lowStockProductsCount;
    private Integer lowStockThreshold;
    private Long activeCampaignsCount;
    private Long newContactMessages;
    private List<ProductDTO> lowStockProducts;
    private List<OrderDTO> recentOrders;
}
