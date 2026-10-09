package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private String sku;
    private Integer stockQuantity;
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private String impactDescription;
    private BigDecimal impactAmount;
    private String status;
    private Boolean featured;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
}
