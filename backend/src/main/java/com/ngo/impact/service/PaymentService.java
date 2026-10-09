package com.ngo.impact.service;

import com.ngo.impact.dto.PaymentInitResponse;
import com.ngo.impact.dto.PaymentVerifyRequest;
import com.ngo.impact.entity.Order;
import com.ngo.impact.entity.OrderItem;
import com.ngo.impact.entity.Payment;
import com.ngo.impact.entity.Product;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.PaymentException;
import com.ngo.impact.exception.PaymentNotConfiguredException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.exception.UnauthorizedException;
import com.ngo.impact.payment.PaymentGateway;
import com.ngo.impact.repository.OrderRepository;
import com.ngo.impact.repository.PaymentRepository;
import com.ngo.impact.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Payment state machine. An order is only ever marked PAID after a cryptographically verified signal from
 * Razorpay: the checkout handler signature, a signed webhook, or a server-side lookup of a captured payment.
 * All three paths converge on {@link #markPaid}, which is idempotent and runs under a row lock.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final String CURRENCY = "INR";

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final PaymentGateway paymentGateway;

    public boolean isOnlinePaymentAvailable() {
        return paymentGateway.isConfigured();
    }

    @Transactional
    public PaymentInitResponse initiatePayment(Long orderId, Long userId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            throw new BadRequestException("Order is already paid");
        }
        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new BadRequestException("This order is " + order.getOrderStatus() + " and cannot be paid");
        }
        if (!paymentGateway.isConfigured()) {
            throw new PaymentNotConfiguredException(
                    "Online payment is not configured on this server yet. Your order " + order.getOrderNumber()
                            + " has been saved as pending - you can pay for it from your account once payments are enabled.");
        }

        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        long amountInPaise = toPaise(order.getTotalAmount());

        // Re-use the provider order on retry when the amount is unchanged (Razorpay allows repeated attempts).
        String providerOrderId;
        if (payment != null && StringUtils.hasText(payment.getRazorpayOrderId())
                && payment.getAmount().compareTo(order.getTotalAmount()) == 0
                && payment.getStatus() != Payment.Status.SUCCESS) {
            providerOrderId = payment.getRazorpayOrderId();
        } else {
            providerOrderId = paymentGateway.createOrder(amountInPaise, CURRENCY, order.getOrderNumber());
        }

        if (payment == null) {
            payment = Payment.builder()
                    .order(order)
                    .paymentGateway("RAZORPAY")
                    .currency(CURRENCY)
                    .build();
        }
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(Payment.Status.PENDING);
        payment.setRazorpayOrderId(providerOrderId);
        paymentRepository.save(payment);

        return PaymentInitResponse.builder()
                .razorpayKeyId(paymentGateway.getKeyId())
                .razorpayOrderId(providerOrderId)
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .amount(order.getTotalAmount())
                .amountInPaise(amountInPaise)
                .currency(CURRENCY)
                .customerName(order.getUser().getFirstName() + " " + order.getUser().getLastName())
                .customerEmail(order.getUser().getEmail())
                .customerPhone(order.getUser().getPhone())
                .build();
    }

    /** Called by the browser after the Razorpay checkout handler fires. */
    // noRollbackFor: a rejected signature must still persist the FAILED status recorded before the exception.
    @Transactional(noRollbackFor = PaymentException.class)
    public boolean verifyPayment(Long userId, PaymentVerifyRequest request) {
        Order order = orderRepository.findByIdForUpdate(request.getOrderId())
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new BadRequestException("Payment has not been started for this order"));

        if (!request.getRazorpayOrderId().equals(payment.getRazorpayOrderId())) {
            throw new PaymentException("Payment does not belong to this order");
        }
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            // Idempotent: a repeated callback (or one racing the webhook) must not double-process.
            return true;
        }
        if (!paymentGateway.verifyPaymentSignature(request.getRazorpayOrderId(), request.getRazorpayPaymentId(),
                request.getRazorpaySignature())) {
            log.warn("Rejected payment signature for order {} (user {})", order.getOrderNumber(), userId);
            payment.setStatus(Payment.Status.FAILED);
            paymentRepository.save(payment);
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            orderRepository.save(order);
            throw new PaymentException("Payment signature verification failed. Transaction rejected.");
        }

        markPaid(order, payment, request.getRazorpayPaymentId(), request.getRazorpaySignature());
        return true;
    }

    /** Records a failed/cancelled checkout attempt reported by the browser. The order stays payable. */
    @Transactional
    public void recordFailure(Long userId, Long orderId, String reason) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) return;
        paymentRepository.findByOrderId(orderId).ifPresent(p -> {
            p.setStatus(Payment.Status.FAILED);
            paymentRepository.save(p);
        });
        order.setPaymentStatus(Order.PaymentStatus.FAILED);
        orderRepository.save(order);
        log.info("Payment attempt for order {} reported as failed/cancelled: {}", order.getOrderNumber(), reason);
    }

    /**
     * Recovery path when the browser closed after paying: asks Razorpay whether the order has a captured payment.
     */
    @Transactional
    public boolean reconcile(Long userId, Long orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) return true;
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (payment == null || !StringUtils.hasText(payment.getRazorpayOrderId())) return false;
        Optional<String> captured = paymentGateway.findCapturedPaymentId(payment.getRazorpayOrderId());
        if (captured.isEmpty()) return false;
        markPaid(order, payment, captured.get(), null);
        return true;
    }

    /**
     * Razorpay webhook. The raw body must be HMAC-verified with the webhook secret before anything is trusted.
     * Handles payment.captured / order.paid (mark paid) and payment.failed.
     */
    @Transactional
    public void handleWebhook(String rawBody, String signature) {
        if (!paymentGateway.isWebhookConfigured()) {
            throw new PaymentNotConfiguredException("Webhook secret is not configured");
        }
        if (!paymentGateway.verifyWebhookSignature(rawBody, signature)) {
            throw new UnauthorizedException("Invalid webhook signature");
        }

        JSONObject event;
        String eventType;
        JSONObject paymentEntity;
        try {
            event = new JSONObject(rawBody);
            eventType = event.getString("event");
            paymentEntity = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        } catch (JSONException e) {
            log.info("Ignoring webhook without a payment entity");
            return;
        }

        String providerOrderId = paymentEntity.optString("order_id", null);
        String providerPaymentId = paymentEntity.optString("id", null);
        if (providerOrderId == null) return;

        Payment payment = paymentRepository.findByRazorpayOrderId(providerOrderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook {} for unknown Razorpay order {}", eventType, providerOrderId);
            return;
        }
        Order order = orderRepository.findByIdForUpdate(payment.getOrder().getId()).orElseThrow();

        switch (eventType) {
            case "payment.captured", "order.paid" -> {
                long paidAmount = paymentEntity.optLong("amount", -1);
                if (paidAmount != toPaise(order.getTotalAmount())) {
                    log.error("Webhook amount mismatch for order {}: paid {} paise, expected {}",
                            order.getOrderNumber(), paidAmount, toPaise(order.getTotalAmount()));
                    return;
                }
                if (order.getPaymentStatus() != Order.PaymentStatus.PAID) {
                    markPaid(order, payment, providerPaymentId, null);
                }
            }
            case "payment.failed" -> {
                if (order.getPaymentStatus() != Order.PaymentStatus.PAID) {
                    payment.setStatus(Payment.Status.FAILED);
                    paymentRepository.save(payment);
                    order.setPaymentStatus(Order.PaymentStatus.FAILED);
                    orderRepository.save(order);
                }
            }
            default -> log.debug("Ignoring webhook event {}", eventType);
        }
    }

    /**
     * Marks the order paid and takes stock, exactly once. Must be called with the order row locked.
     * If stock ran out between checkout and payment, the order is cancelled (payment kept as PAID so the
     * admin dashboard shows it needs a refund) rather than overselling.
     */
    private void markPaid(Order order, Payment payment, String providerPaymentId, String signature) {
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) return;

        payment.setRazorpayPaymentId(providerPaymentId);
        if (signature != null) payment.setRazorpaySignature(signature);
        payment.setStatus(Payment.Status.SUCCESS);
        paymentRepository.save(payment);
        order.setPaymentStatus(Order.PaymentStatus.PAID);

        // Lock products in a stable order to avoid deadlocks between concurrent payments.
        List<OrderItem> items = new ArrayList<>(order.getItems());
        items.sort(Comparator.comparing(i -> i.getProduct().getId()));
        List<Product> locked = new ArrayList<>();
        List<String> shortages = new ArrayList<>();
        for (OrderItem item : items) {
            Product p = productRepository.findByIdForUpdate(item.getProduct().getId()).orElseThrow();
            locked.add(p);
            if (p.getStockQuantity() < item.getQuantity()) {
                shortages.add(p.getName() + " (wanted " + item.getQuantity() + ", available " + p.getStockQuantity() + ")");
            }
        }

        if (!shortages.isEmpty()) {
            order.setOrderStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
            log.error("Order {} was paid but stock ran out: {}. Order cancelled - REFUND REQUIRED.",
                    order.getOrderNumber(), shortages);
            return;
        }

        for (int i = 0; i < items.size(); i++) {
            Product p = locked.get(i);
            p.setStockQuantity(p.getStockQuantity() - items.get(i).getQuantity());
            ProductService.syncStockStatus(p);
            productRepository.save(p);
        }
        order.setOrderStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Remove only the purchased products from the cart (items added after checkout stay).
        cartService.removeProducts(order.getUser().getId(),
                items.stream().map(i -> i.getProduct().getId()).toList());
        log.info("Order {} paid (payment {})", order.getOrderNumber(), providerPaymentId);
    }

    private static long toPaise(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }
}
