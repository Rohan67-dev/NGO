package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String orderStatus;
    private String shippingAddressSnapshot;
    private String trackingNumber;
    private String shippingCarrier;
    private List<OrderItemDTO> items;
    private String razorpayOrderId;
    /** Status transitions an administrator may apply next. */
    private List<String> allowedNextStatuses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
