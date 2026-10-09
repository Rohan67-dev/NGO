package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    @jakarta.validation.constraints.NotBlank(message = "Category name is required")
    @jakarta.validation.constraints.Size(max = 120)
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private Boolean active;
    private Long productCount;
}
