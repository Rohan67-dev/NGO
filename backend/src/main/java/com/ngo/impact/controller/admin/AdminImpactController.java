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

import java.util.List;

@RestController
@RequestMapping("/api/admin/impact")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminImpactController {

    private final ImpactService impactService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<ImpactMetricDTO>>> listMetrics() {
        return ResponseEntity.ok(ApiResponse.success(impactService.getAllMetrics()));
    }

    @PostMapping("/metrics")
    public ResponseEntity<ApiResponse<ImpactMetricDTO>> saveMetric(@Valid @RequestBody ImpactMetricDTO request) {
        ImpactMetricDTO saved = impactService.saveMetric(request);
        return ResponseEntity.ok(ApiResponse.success("Impact metric saved successfully", saved));
    }

    @PutMapping("/metrics/{id}")
    public ResponseEntity<ApiResponse<ImpactMetricDTO>> updateMetric(@PathVariable Long id, @Valid @RequestBody ImpactMetricDTO request) {
        request.setId(id);
        return ResponseEntity.ok(ApiResponse.success("Impact metric updated", impactService.saveMetric(request)));
    }

    @DeleteMapping("/metrics/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMetric(@PathVariable Long id) {
        impactService.deleteMetric(id);
        return ResponseEntity.ok(ApiResponse.success("Impact metric deleted", null));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<ImpactProjectDTO>>> listProjects() {
        return ResponseEntity.ok(ApiResponse.success(impactService.getAllProjects()));
    }

    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<ImpactProjectDTO>> saveProject(@Valid @RequestBody ImpactProjectDTO request) {
        ImpactProjectDTO saved = impactService.saveProject(request);
        return ResponseEntity.ok(ApiResponse.success("Impact project saved successfully", saved));
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<ImpactProjectDTO>> updateProject(@PathVariable Long id, @Valid @RequestBody ImpactProjectDTO request) {
        request.setId(id);
        return ResponseEntity.ok(ApiResponse.success("Impact project updated", impactService.saveProject(request)));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        impactService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Impact project deleted", null));
    }
}
