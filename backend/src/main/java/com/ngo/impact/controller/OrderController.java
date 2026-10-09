package com.ngo.impact.controller;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CreateOrderRequest;
import com.ngo.impact.dto.OrderDTO;
import com.ngo.impact.security.UserPrincipal;
import com.ngo.impact.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDTO>> createOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderDTO order = orderService.createOrder(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDTO>>> getCustomerOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<OrderDTO> orders = orderService.getCustomerOrders(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        OrderDTO order = orderService.getOrderForCustomer(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDTO>> cancelOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        OrderDTO order = orderService.cancelOrderByCustomer(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", order));
    }
}
