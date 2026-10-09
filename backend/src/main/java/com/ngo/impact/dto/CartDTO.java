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
public class CartDTO {
    private Long id;
    private Long userId;
    private List<CartItemDTO> items;
    private BigDecimal subtotal;
    private Integer totalItems;
    private BigDecimal shippingAmount;
    private BigDecimal taxAmount;
    private BigDecimal taxRatePercent;
    private BigDecimal totalAmount;
    private BigDecimal freeShippingThreshold;
    private Boolean hasUnavailableItems;
}
