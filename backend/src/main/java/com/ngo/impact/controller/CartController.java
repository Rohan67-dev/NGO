package com.ngo.impact.controller;

import com.ngo.impact.dto.AddToCartRequest;
import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CartDTO;
import com.ngo.impact.security.UserPrincipal;
import com.ngo.impact.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartDTO>> getCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        CartDTO cart = cartService.getCartByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AddToCartRequest request) {
        CartDTO cart = cartService.addToCart(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cart));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDTO>> updateQuantity(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        CartDTO cart = cartService.updateCartItemQuantity(userPrincipal.getId(), itemId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Cart updated", cart));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDTO>> removeItem(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long itemId) {
        CartDTO cart = cartService.removeCartItem(userPrincipal.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        cartService.clearCart(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}
