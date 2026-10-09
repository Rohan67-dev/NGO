package com.ngo.impact.controller;

import com.ngo.impact.dto.AddressDTO;
import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.security.UserPrincipal;
import com.ngo.impact.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressDTO>>> list(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(addressService.list(user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressDTO>> create(@AuthenticationPrincipal UserPrincipal user,
                                                          @Valid @RequestBody AddressDTO request) {
        return ResponseEntity.ok(ApiResponse.success("Address saved", addressService.create(user.getId(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressDTO>> update(@AuthenticationPrincipal UserPrincipal user,
                                                          @PathVariable Long id,
                                                          @Valid @RequestBody AddressDTO request) {
        return ResponseEntity.ok(ApiResponse.success("Address updated", addressService.update(user.getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        addressService.delete(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }
}
