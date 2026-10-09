package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ImpactStoryDTO;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stories")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminStoryController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ImpactStoryDTO>>> listStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(impactService.getAllStories(page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ImpactStoryDTO>> saveStory(@Valid @RequestBody ImpactStoryDTO request) {
        ImpactStoryDTO saved = impactService.saveStory(request);
        return ResponseEntity.ok(ApiResponse.success("Impact story saved successfully", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ImpactStoryDTO>> updateStory(@PathVariable Long id, @Valid @RequestBody ImpactStoryDTO request) {
        request.setId(id);
        return ResponseEntity.ok(ApiResponse.success("Impact story updated", impactService.saveStory(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStory(@PathVariable Long id) {
        impactService.deleteStory(id);
        return ResponseEntity.ok(ApiResponse.success("Impact story deleted", null));
    }
}
