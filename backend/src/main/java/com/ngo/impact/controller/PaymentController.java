package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.PaymentInitResponse;
import com.ngo.impact.dto.PaymentVerifyRequest;
import com.ngo.impact.security.UserPrincipal;
import com.ngo.impact.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate/{orderId}")
    public ResponseEntity<ApiResponse<PaymentInitResponse>> initiatePayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long orderId) {
        PaymentInitResponse response = paymentService.initiatePayment(orderId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment initiated", response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyPayment(@Valid @RequestBody PaymentVerifyRequest request) {
        boolean verified = paymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", verified));
    }
}
