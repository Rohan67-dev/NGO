package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ImpactMetricDTO;
import com.ngo.impact.dto.ImpactProjectDTO;
import com.ngo.impact.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/impact")
@RequiredArgsConstructor
public class ImpactController {

    private final ImpactService impactService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<ImpactMetricDTO>>> getMetrics() {
        List<ImpactMetricDTO> metrics = impactService.getActiveMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<ImpactProjectDTO>>> getProjects() {
        List<ImpactProjectDTO> projects = impactService.getActiveProjects();
        return ResponseEntity.ok(ApiResponse.success(projects));
    }
}
