package com.ngo.impact.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentFailureRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @Size(max = 500)
    private String reason;
}
