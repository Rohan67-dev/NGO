package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.AnnouncementDTO;
import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ContactMessageDTO;
import com.ngo.impact.dto.StatusUpdateRequest;
import com.ngo.impact.service.ImpactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Announcements (site banner) and the contact-form inbox. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminContentController {

    private final ImpactService impactService;

    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<AnnouncementDTO>>> listAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success(impactService.getAllAnnouncements()));
    }

    @PostMapping("/announcements")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> createAnnouncement(@Valid @RequestBody AnnouncementDTO request) {
        request.setId(null);
        return ResponseEntity.ok(ApiResponse.success("Announcement saved", impactService.saveAnnouncement(request)));
    }

    @PutMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> updateAnnouncement(@PathVariable Long id, @Valid @RequestBody AnnouncementDTO request) {
        request.setId(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement updated", impactService.saveAnnouncement(request)));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable Long id) {
        impactService.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted", null));
    }

    @GetMapping("/contact-messages")
    public ResponseEntity<ApiResponse<Page<ContactMessageDTO>>> listMessages(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(impactService.getContactMessages(status, page, size)));
    }

    @PutMapping("/contact-messages/{id}/status")
    public ResponseEntity<ApiResponse<ContactMessageDTO>> updateMessageStatus(@PathVariable Long id,
                                                                             @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Message updated", impactService.updateContactStatus(id, request.getStatus())));
    }
}
