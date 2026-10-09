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
    private String title;
    private String description;
    private Long value;
    private String unit;
    private String icon;
    private Integer displayOrder;
    private Boolean active;
}
