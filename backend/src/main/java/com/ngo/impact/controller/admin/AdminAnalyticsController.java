package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.AdminAnalyticsDTO;
import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminAnalyticsDTO>> getAnalyticsOverview() {
        AdminAnalyticsDTO analytics = adminAnalyticsService.getAnalyticsOverview();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
