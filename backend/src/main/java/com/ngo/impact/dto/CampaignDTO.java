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
    private String title;
    private String slug;
    private String description;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private Double progressPercentage;
    private LocalDate startDate;
    private LocalDate endDate;
    private String imageUrl;
    private String status;
    private Boolean featured;
}
