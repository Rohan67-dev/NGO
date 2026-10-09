package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.OrderDTO;
import com.ngo.impact.dto.OrderStatusUpdateRequest;
import com.ngo.impact.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<OrderDTO> orders = orderService.getAllOrdersAdmin(page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderDTO>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderDTO updatedOrder = orderService.updateOrderStatus(id, request.getOrderStatus(), request.getTrackingNumber(), request.getShippingCarrier());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updatedOrder));
    }
}
