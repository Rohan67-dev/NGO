package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignDTO {
    private Long id;
    @jakarta.validation.constraints.NotBlank(message = "Title is required")
    private String title;
    private String slug;
    @jakarta.validation.constraints.NotBlank(message = "Description is required")
    private String description;
    @jakarta.validation.constraints.NotNull(message = "Target amount is required")
    @jakarta.validation.constraints.DecimalMin(value = "1", message = "Target amount must be positive")
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private Double progressPercentage;
    private LocalDate startDate;
    private LocalDate endDate;
    private String imageUrl;
    private String status;
    private Boolean featured;
}
