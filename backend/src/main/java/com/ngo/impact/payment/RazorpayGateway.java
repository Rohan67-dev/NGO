package com.ngo.impact.payment;

import com.ngo.impact.exception.PaymentException;
import com.ngo.impact.exception.PaymentNotConfiguredException;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;

@Component
@Slf4j
public class RazorpayGateway implements PaymentGateway {

    private static final String PLACEHOLDER_PREFIX = "rzp_test_placeholder";
    private static final String WEBHOOK_PLACEHOLDER = "rzp_webhook_secret_placeholder";

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;

    public RazorpayGateway(@Value("${app.razorpay.key-id}") String keyId,
                           @Value("${app.razorpay.key-secret}") String keySecret,
                           @Value("${app.razorpay.webhook-secret}") String webhookSecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        if (!isConfigured()) {
            log.warn("Razorpay credentials are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET). "
                    + "Orders can be placed but online payment will be unavailable.");
        }
    }

    @Override
    public boolean isConfigured() {
        return StringUtils.hasText(keyId) && StringUtils.hasText(keySecret)
                && !keyId.startsWith(PLACEHOLDER_PREFIX) && !keySecret.startsWith(PLACEHOLDER_PREFIX);
    }

    @Override
    public boolean isWebhookConfigured() {
        return StringUtils.hasText(webhookSecret) && !WEBHOOK_PLACEHOLDER.equals(webhookSecret);
    }

    @Override
    public String getKeyId() {
        return keyId;
    }

    @Override
    public String createOrder(long amountInPaise, String currency, String receipt) {
        requireConfigured();
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject request = new JSONObject();
            request.put("amount", amountInPaise);
            request.put("currency", currency);
            request.put("receipt", receipt);
            com.razorpay.Order order = client.orders.create(request);
            return order.get("id");
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed for receipt {}", receipt, e);
            throw new PaymentException("The payment provider could not start this payment. Please try again shortly.");
        }
    }

    @Override
    public Optional<String> findCapturedPaymentId(String providerOrderId) {
        requireConfigured();
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            for (com.razorpay.Payment p : client.orders.fetchPayments(providerOrderId)) {
                if ("captured".equals(p.get("status"))) {
                    return Optional.of(p.get("id"));
                }
            }
            return Optional.empty();
        } catch (RazorpayException e) {
            log.error("Razorpay payment lookup failed for order {}", providerOrderId, e);
            throw new PaymentException("Could not reach the payment provider to check this payment. Please try again shortly.");
        }
    }

    @Override
    public boolean verifyPaymentSignature(String providerOrderId, String paymentId, String signature) {
        if (!isConfigured()) return false;
        return constantTimeEquals(hmacSha256Hex(providerOrderId + "|" + paymentId, keySecret), signature);
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signature) {
        if (!isWebhookConfigured()) return false;
        return constantTimeEquals(hmacSha256Hex(rawBody, webhookSecret), signature);
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new PaymentNotConfiguredException(
                    "Online payment is not configured on this server yet. Your order has been saved as pending - please try again later or contact us.");
        }
    }

    public static String hmacSha256Hex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 unavailable", e);
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                actual.toLowerCase().getBytes(StandardCharsets.UTF_8));
    }
}
