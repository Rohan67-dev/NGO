package com.ngo.impact.payment;

import java.util.Optional;

/**
 * Abstraction over the payment provider (Razorpay) so the order/payment state machine can be tested
 * without network access or live credentials.
 */
public interface PaymentGateway {

    /** True when real provider credentials are configured. */
    boolean isConfigured();

    /** Public key id handed to the browser checkout widget. */
    String getKeyId();

    /** Creates a provider-side order for the amount (in paise) and returns the provider order id. */
    String createOrder(long amountInPaise, String currency, String receipt);

    /** Returns the id of a captured payment for the provider order, if any (used for reconciliation). */
    Optional<String> findCapturedPaymentId(String providerOrderId);

    /** Verifies the checkout handler signature: HMAC_SHA256(orderId + "|" + paymentId, keySecret). */
    boolean verifyPaymentSignature(String providerOrderId, String paymentId, String signature);

    /** Verifies a webhook body signature: HMAC_SHA256(rawBody, webhookSecret). */
    boolean verifyWebhookSignature(String rawBody, String signature);

    /** True when a webhook secret is configured. */
    boolean isWebhookConfigured();
}
