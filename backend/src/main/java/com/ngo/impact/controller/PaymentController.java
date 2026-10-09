package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.PaymentFailureRequest;
import com.ngo.impact.dto.PaymentInitResponse;
import com.ngo.impact.dto.PaymentVerifyRequest;
import com.ngo.impact.security.UserPrincipal;
import com.ngo.impact.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** Lets the checkout page tell customers up-front whether online payment is available. */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("onlinePaymentAvailable", paymentService.isOnlinePaymentAvailable())));
    }

    @PostMapping("/initiate/{orderId}")
    public ResponseEntity<ApiResponse<PaymentInitResponse>> initiatePayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long orderId) {
        PaymentInitResponse response = paymentService.initiatePayment(orderId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment initiated", response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyPayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody PaymentVerifyRequest request) {
        boolean verified = paymentService.verifyPayment(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", verified));
    }

    @PostMapping("/failure")
    public ResponseEntity<ApiResponse<Void>> reportFailure(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody PaymentFailureRequest request) {
        paymentService.recordFailure(userPrincipal.getId(), request.getOrderId(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Payment attempt recorded", null));
    }

    @PostMapping("/reconcile/{orderId}")
    public ResponseEntity<ApiResponse<Boolean>> reconcile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long orderId) {
        boolean paid = paymentService.reconcile(userPrincipal.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(paid ? "Payment found and confirmed" : "No completed payment found yet", paid));
    }

    /** Razorpay webhook (configure URL https://<host>/api/payments/webhook with the same secret as RAZORPAY_WEBHOOK_SECRET). */
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> webhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(rawBody, signature);
        return ResponseEntity.ok(ApiResponse.success("ok", null));
    }
}
