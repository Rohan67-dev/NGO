package com.ngo.impact;

import com.ngo.impact.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * With the placeholder Razorpay credentials (the default), the server must refuse to pretend a payment happened.
 * This is the regression test for the original "demo payment" defect.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:nopay;DB_CLOSE_DELAY=-1")
class PaymentNotConfiguredIntegrationTest extends ApiTestSupport {

    @Test
    void placeholderCredentialsNeverMarkAnOrderPaid() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "No Payment Product", "100.00", null, 5);
        String customer = newCustomer();

        assertThat(get("/api/payments/config", customer).data().path("onlinePaymentAvailable").asBoolean()).isFalse();

        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 1));
        long orderId = post("/api/orders", customer, Map.of("shippingAddress", address())).data().path("id").asLong();

        Resp init = post("/api/payments/initiate/" + orderId, customer, null);
        assertThat(init.status()).isEqualTo(503);
        assertThat(init.message()).contains("not configured");

        // The exact request the old frontend "demo" fallback sent
        Resp verify = post("/api/payments/verify", customer, Map.of("orderId", orderId, "razorpayOrderId", "rzp_ord_123",
                "razorpayPaymentId", "pay_demo_1", "razorpaySignature", "sig_demo_1"));
        assertThat(verify.status()).isIn(400, 402);

        assertThat(get("/api/orders/" + orderId, customer).data().path("paymentStatus").asText()).isNotEqualTo("PAID");
        assertThat(stockOf(productId)).isEqualTo(5);

        // Webhooks are rejected while no webhook secret is configured
        Resp hook = call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/payments/webhook")
                .header("X-Razorpay-Signature", "x"), null, "{}");
        assertThat(hook.status()).isEqualTo(503);
    }
}
