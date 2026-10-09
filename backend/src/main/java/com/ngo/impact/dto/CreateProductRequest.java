package com.ngo.impact.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String shortDescription;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    private BigDecimal discountPrice;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private String impactDescription;
    private BigDecimal impactAmount;

    private String status;
    private Boolean featured;

    private List<String> imageUrls;
}
