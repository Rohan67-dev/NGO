package com.ngo.impact.controller;

import com.ngo.impact.dto.AnnouncementDTO;
import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementDTO>>> getAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success(impactService.getActiveAnnouncements()));
    }
}
