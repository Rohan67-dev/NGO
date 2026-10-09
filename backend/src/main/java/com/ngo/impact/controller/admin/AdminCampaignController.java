package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CampaignDTO;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/campaigns")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminCampaignController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CampaignDTO>>> listCampaigns() {
        return ResponseEntity.ok(ApiResponse.success(impactService.getAllCampaigns()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CampaignDTO>> saveCampaign(@Valid @RequestBody CampaignDTO request) {
        CampaignDTO saved = impactService.saveCampaign(request);
        return ResponseEntity.ok(ApiResponse.success("Campaign saved successfully", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignDTO>> updateCampaign(@PathVariable Long id, @Valid @RequestBody CampaignDTO request) {
        request.setId(id);
        return ResponseEntity.ok(ApiResponse.success("Campaign updated successfully", impactService.saveCampaign(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(@PathVariable Long id) {
        impactService.deleteCampaign(id);
        return ResponseEntity.ok(ApiResponse.success("Campaign deleted", null));
    }
}
