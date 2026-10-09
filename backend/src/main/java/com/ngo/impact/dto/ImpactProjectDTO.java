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
    @jakarta.validation.constraints.NotBlank(message = "Title is required")
    private String title;
    @jakarta.validation.constraints.NotBlank(message = "Description is required")
    private String description;
    @jakarta.validation.constraints.NotBlank(message = "Location is required")
    private String location;
    private Long beneficiariesCount;
    private String imageUrl;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
}
