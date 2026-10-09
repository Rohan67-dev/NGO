package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal discountPrice;
    /** Price actually charged per unit (discount price when present). */
    private BigDecimal unitPrice;
    private String impactDescription;
    private Integer quantity;
    private Integer stockQuantity;
    /** False when the product was deactivated or stock fell below the cart quantity. */
    private Boolean available;
    private BigDecimal itemTotal;
}
