package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactProjectDTO {
    private Long id;
    private String title;
    private String description;
    private String location;
    private Long beneficiariesCount;
    private String imageUrl;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
}
