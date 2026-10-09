package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CampaignDTO;
import com.ngo.impact.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CampaignDTO>>> getCampaigns() {
        List<CampaignDTO> campaigns = impactService.getActiveCampaigns();
        return ResponseEntity.ok(ApiResponse.success(campaigns));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<CampaignDTO>> getCampaignBySlug(@PathVariable String slug) {
        CampaignDTO campaign = impactService.getCampaignBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(campaign));
    }
}
