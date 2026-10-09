package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitResponse {
    private String razorpayKeyId;
    private String razorpayOrderId;
    private Long orderId;
    private String orderNumber;
    private BigDecimal amount;
    private Long amountInPaise;
    private String currency;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
