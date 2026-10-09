package com.ngo.impact.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDTO {
    private Long id;
    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;
    @NotBlank(message = "Content is required")
    @Size(max = 500)
    private String content;
    @Size(max = 255)
    private String linkUrl;
    private Boolean active;
    private LocalDateTime createdAt;
}
