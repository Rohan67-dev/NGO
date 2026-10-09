package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CampaignDTO;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/campaigns")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminCampaignController {

    private final ImpactService impactService;

    @PostMapping
    public ResponseEntity<ApiResponse<CampaignDTO>> saveCampaign(@Valid @RequestBody CampaignDTO request) {
        CampaignDTO saved = impactService.saveCampaign(request);
        return ResponseEntity.ok(ApiResponse.success("Campaign saved successfully", saved));
    }
}
