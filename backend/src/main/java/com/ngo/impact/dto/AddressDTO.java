package com.ngo.impact.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDTO {
    private Long id;
    @NotBlank(message = "Full name is required")
    private String fullName;
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+0-9 ()-]{7,20}$", message = "Phone number is invalid")
    private String phone;
    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;
    private String addressLine2;
    @NotBlank(message = "City is required")
    private String city;
    @NotBlank(message = "State is required")
    private String state;
    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^[A-Za-z0-9 -]{3,10}$", message = "Postal code is invalid")
    private String postalCode;
    @NotBlank(message = "Country is required")
    private String country;
    private Boolean isDefault;
}
