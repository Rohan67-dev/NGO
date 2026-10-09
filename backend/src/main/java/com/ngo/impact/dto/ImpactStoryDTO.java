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
    private String title;
    private String slug;
    private String excerpt;
    private String content;
    private String imageUrl;
    private String author;
    private Boolean published;
    private LocalDateTime publishedAt;
}
