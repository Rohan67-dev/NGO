package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactStoryDTO {
    private Long id;
    @jakarta.validation.constraints.NotBlank(message = "Title is required")
    private String title;
    private String slug;
    @jakarta.validation.constraints.NotBlank(message = "Excerpt is required")
    private String excerpt;
    @jakarta.validation.constraints.NotBlank(message = "Content is required")
    private String content;
    private String imageUrl;
    private String author;
    private Boolean published;
    private LocalDateTime publishedAt;
}
