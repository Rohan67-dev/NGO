package com.ngo.impact.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateProductRequest {
    @NotBlank(message = "Product name is required")
    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 255)
    private String shortDescription;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    @DecimalMin(value = "0.00", message = "Discount price must be greater than or equal to 0")
    private BigDecimal discountPrice;

    @NotBlank(message = "SKU is required")
    @Size(max = 100)
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

    private String sourceSerialNo;
    private String brand;
    private String manufacturer;
    private String hsnCode;

    @DecimalMin(value = "0.00", message = "GST rate cannot be negative")
    @DecimalMax(value = "100.00", message = "GST rate cannot exceed 100")
    private BigDecimal gstRate;

    private String material;
    private String dimensions;
    private String colour;
    private String listingStatus;
}
