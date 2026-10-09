package com.ngo.impact.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {
    @NotNull(message = "Shipping address is required")
    @Valid
    private AddressDTO shippingAddress;

    /** When true the shipping address is stored in the customer's address book (if not already there). */
    private Boolean saveAddress;
}
