package com.ngo.impact.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    @NotBlank(message = "Order status is required")
    private String orderStatus;
    private String paymentStatus;
    private String trackingNumber;
    private String shippingCarrier;
}
