package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.security.UserPrincipal;
import com.ngo.impact.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getWishlist(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<ProductDTO> items = wishlistService.getUserWishlist(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> addToWishlist(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long productId) {
        wishlistService.addToWishlist(userPrincipal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist", null));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long productId) {
        wishlistService.removeFromWishlist(userPrincipal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist", null));
    }
}
