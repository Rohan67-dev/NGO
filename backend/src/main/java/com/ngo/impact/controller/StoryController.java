package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ImpactStoryDTO;
import com.ngo.impact.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ImpactStoryDTO>>> getStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        Page<ImpactStoryDTO> stories = impactService.getPublishedStories(page, size);
        return ResponseEntity.ok(ApiResponse.success(stories));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ImpactStoryDTO>> getStoryBySlug(@PathVariable String slug) {
        ImpactStoryDTO story = impactService.getStoryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(story));
    }
}
