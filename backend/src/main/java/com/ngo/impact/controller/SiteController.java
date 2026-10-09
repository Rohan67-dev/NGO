package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** Public organisation details, configured in application.yml (app.ngo.*) instead of being hard-coded in the UI. */
@RestController
@RequestMapping("/api/site")
public class SiteController {

    @Value("${app.ngo.name}")
    private String name;
    @Value("${app.ngo.email}")
    private String email;
    @Value("${app.ngo.phone}")
    private String phone;
    @Value("${app.ngo.address}")
    private String address;

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, String>>> info() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("name", name);
        info.put("email", email);
        info.put("phone", phone);
        info.put("address", address);
        return ResponseEntity.ok(ApiResponse.success(info));
    }
}
