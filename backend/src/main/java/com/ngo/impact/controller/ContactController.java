package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ContactRequest;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ImpactService impactService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitContact(@Valid @RequestBody ContactRequest request) {
        impactService.submitContactMessage(request.getName(), request.getEmail(), request.getPhone(), request.getSubject(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.success("Message submitted successfully", null));
    }
}
