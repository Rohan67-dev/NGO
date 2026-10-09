package com.ngo.impact.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {
    @NotNull(message = "Shipping address is required")
    private AddressDTO shippingAddress;
}
