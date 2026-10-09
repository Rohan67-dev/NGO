package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.entity.Announcement;
import com.ngo.impact.service.ImpactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final ImpactService impactService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements() {
        List<Announcement> list = impactService.getActiveAnnouncements();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
