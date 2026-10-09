package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactMetricDTO {
    private Long id;
    @jakarta.validation.constraints.NotBlank(message = "Title is required")
    private String title;
    private String description;
    @jakarta.validation.constraints.NotNull(message = "Value is required")
    @jakarta.validation.constraints.Min(value = 0, message = "Value cannot be negative")
    private Long value;
    private String unit;
    private String icon;
    private Integer displayOrder;
    private Boolean active;
}
