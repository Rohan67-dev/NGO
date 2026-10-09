package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ImpactStoryDTO;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stories")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminStoryController {

    private final ImpactService impactService;

    @PostMapping
    public ResponseEntity<ApiResponse<ImpactStoryDTO>> saveStory(@Valid @RequestBody ImpactStoryDTO request) {
        ImpactStoryDTO saved = impactService.saveStory(request);
        return ResponseEntity.ok(ApiResponse.success("Impact story saved successfully", saved));
    }
}
