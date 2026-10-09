package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ImpactMetricDTO;
import com.ngo.impact.dto.ImpactProjectDTO;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/impact")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminImpactController {

    private final ImpactService impactService;

    @PostMapping("/metrics")
    public ResponseEntity<ApiResponse<ImpactMetricDTO>> saveMetric(@Valid @RequestBody ImpactMetricDTO request) {
        ImpactMetricDTO saved = impactService.saveMetric(request);
        return ResponseEntity.ok(ApiResponse.success("Impact metric saved successfully", saved));
    }

    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<ImpactProjectDTO>> saveProject(@Valid @RequestBody ImpactProjectDTO request) {
        ImpactProjectDTO saved = impactService.saveProject(request);
        return ResponseEntity.ok(ApiResponse.success("Impact project saved successfully", saved));
    }
}
