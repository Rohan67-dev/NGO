package com.ngo.impact;

import com.fasterxml.jackson.databind.JsonNode;
import com.ngo.impact.payment.RazorpayGateway;
import com.ngo.impact.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

/**
 * End-to-end API tests against the real Spring context and an in-memory H2 database.
 * Only the outbound Razorpay "create order" HTTP call is stubbed; signature checks use the real HMAC code.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:commerce;DB_CLOSE_DELAY=-1",
        "app.razorpay.key-id=rzp_test_unitkey",
        "app.razorpay.key-secret=" + ApiTestSupport.TEST_KEY_SECRET,
        "app.razorpay.webhook-secret=" + ApiTestSupport.TEST_WEBHOOK_SECRET,
})
class CommerceFlowIntegrationTest extends ApiTestSupport {

    private static final AtomicInteger RZP_SEQ = new AtomicInteger();

    @SpyBean
    RazorpayGateway gateway;

    @BeforeEach
    void stubProviderOrderCreation() {
        doAnswer(inv -> "order_TEST" + RZP_SEQ.incrementAndGet()).when(gateway).createOrder(anyLong(), anyString(), anyString());
    }

    // ------------------------------------------------------------------ catalogue & auth

    @Test
    void publicCatalogueSearchSortAndFilters() throws Exception {
        Resp list = get("/api/products?sortBy=price&sortDir=asc&size=50", null);
        assertThat(list.status()).isEqualTo(200);
        assertThat(list.data().path("totalElements").asInt()).isGreaterThan(0);

        Resp search = get("/api/products?query=BAMBOO", null);
        assertThat(search.data().path("content").get(0).path("name").asText()).containsIgnoringCase("bamboo");

        Resp priceFilter = get("/api/products?maxPrice=450", null);
        for (JsonNode p : priceFilter.data().path("content")) {
            double effective = p.path("discountPrice").isNull() ? p.path("price").asDouble() : p.path("discountPrice").asDouble();
            assertThat(effective).isLessThanOrEqualTo(450);
        }

        Resp badSort = get("/api/products?sortBy=password", null);
        assertThat(badSort.status()).isEqualTo(400);
        assertThat(badSort.message()).doesNotContain("org.hibernate");
    }

    @Test
    void authenticationAndAuthorisationAreEnforced() throws Exception {
        assertThat(get("/api/cart", null).status()).isEqualTo(401);
        assertThat(get("/api/auth/me", null).status()).isEqualTo(401);

        String customer = newCustomer();
        assertThat(get("/api/admin/analytics", customer).status()).isEqualTo(403);
        assertThat(post("/api/admin/products", customer, Map.of("name", "x")).status()).isEqualTo(403);

        // Email login is case-insensitive (registration stores lower case)
        assertThat(post("/api/auth/login", null, Map.of("email", "CUSTOMER@NGO.ORG", "password", "customer123")).status())
                .isEqualTo(200);
        assertThat(post("/api/auth/login", null, Map.of("email", "customer@ngo.org", "password", "wrong")).status())
                .isEqualTo(401);
    }

    @Test
    void profileUpdateAndPasswordChange() throws Exception {
        String token = newCustomer();
        Resp updated = put("/api/auth/me", token, Map.of("firstName", "Asha", "lastName", "Patil", "phone", "+91 91111 11111"));
        assertThat(updated.status()).isEqualTo(200);
        assertThat(get("/api/auth/me", token).data().path("firstName").asText()).isEqualTo("Asha");

        assertThat(put("/api/auth/me/password", token, Map.of("currentPassword", "nope", "newPassword", "newsecret1")).status())
                .isEqualTo(400);
        assertThat(put("/api/auth/me/password", token, Map.of("currentPassword", "secret123", "newPassword", "newsecret1")).status())
                .isEqualTo(200);
    }

    // ------------------------------------------------------------------ cart

    @Test
    void cartUsesServerPricesAndEnforcesStockAndOwnership() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Cart Test Lamp", "500.00", "400.00", 3);
        String customer = newCustomer();

        Resp added = post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 2));
        assertThat(added.status()).isEqualTo(200);
        JsonNode item = added.data().path("items").get(0);
        assertThat(item.path("id").isNumber()).isTrue();
        assertThat(item.path("unitPrice").decimalValue()).isEqualByComparingTo("400.00");
        assertThat(added.data().path("subtotal").decimalValue()).isEqualByComparingTo("800.00");
        assertThat(added.data().path("shippingAmount").decimalValue()).isEqualByComparingTo("99.00");
        assertThat(added.data().path("taxAmount").decimalValue()).isEqualByComparingTo("40.00");
        assertThat(added.data().path("totalAmount").decimalValue()).isEqualByComparingTo("939.00");

        // Cannot exceed stock
        assertThat(post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 2)).status()).isEqualTo(400);
        // Invalid quantity rejected by validation
        assertThat(post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 0)).status()).isEqualTo(400);

        long itemId = item.path("id").asLong();
        // Another customer cannot touch this cart line
        String other = newCustomer();
        assertThat(put("/api/cart/items/" + itemId + "?quantity=1", other, null).status()).isEqualTo(404);
        assertThat(delete("/api/cart/items/" + itemId, other).status()).isEqualTo(404);

        Resp updated = put("/api/cart/items/" + itemId + "?quantity=3", customer, null);
        assertThat(updated.data().path("totalItems").asInt()).isEqualTo(3);
        Resp removed = delete("/api/cart/items/" + itemId, customer);
        assertThat(removed.data().path("items").size()).isZero();
    }

    // ------------------------------------------------------------------ orders & payments

    @Test
    void fakePaymentSignatureIsRejectedAndOrderStaysUnpaid() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Signature Test Bowl", "300.00", null, 5);
        String customer = newCustomer();
        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 1));

        long orderId = post("/api/orders", customer, Map.of("shippingAddress", address())).data().path("id").asLong();
        Resp init = post("/api/payments/initiate/" + orderId, customer, null);
        assertThat(init.status()).isEqualTo(200);
        String rzpOrderId = init.data().path("razorpayOrderId").asText();
        assertThat(init.data().path("amountInPaise").asLong()).isEqualTo(41400); // 300 + 99 shipping + 15 tax

        Resp verify = post("/api/payments/verify", customer, Map.of("orderId", orderId, "razorpayOrderId", rzpOrderId,
                "razorpayPaymentId", "pay_fake", "razorpaySignature", "fake"));
        assertThat(verify.status()).isEqualTo(402);

        JsonNode order = get("/api/orders/" + orderId, customer).data();
        assertThat(order.path("paymentStatus").asText()).isEqualTo("FAILED");
        assertThat(order.path("orderStatus").asText()).isEqualTo("PENDING");
        assertThat(stockOf(productId)).isEqualTo(5);
    }

    @Test
    void verifiedPaymentConfirmsOrderTakesStockOnceAndIsIdempotent() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Paid Flow Basket", "600.00", "500.00", 10);
        String customer = newCustomer();
        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 2));

        Resp order = post("/api/orders", customer, Map.of("shippingAddress", address(), "saveAddress", true));
        assertThat(order.status()).isEqualTo(200);
        JsonNode o = order.data();
        assertThat(o.path("subtotal").decimalValue()).isEqualByComparingTo("1000.00");
        assertThat(o.path("shippingAmount").decimalValue()).isEqualByComparingTo("0.00");
        assertThat(o.path("taxAmount").decimalValue()).isEqualByComparingTo("50.00");
        assertThat(o.path("totalAmount").decimalValue()).isEqualByComparingTo("1050.00");
        long orderId = o.path("id").asLong();

        // Double-submitted checkout reuses the same unpaid order
        Resp again = post("/api/orders", customer, Map.of("shippingAddress", address()));
        assertThat(again.data().path("id").asLong()).isEqualTo(orderId);

        // Address was saved to the address book
        assertThat(get("/api/addresses", customer).data().size()).isEqualTo(1);

        String rzpOrderId = post("/api/payments/initiate/" + orderId, customer, null).data().path("razorpayOrderId").asText();
        String paymentId = "pay_OK" + orderId;
        Map<String, Object> verifyBody = Map.of("orderId", orderId, "razorpayOrderId", rzpOrderId,
                "razorpayPaymentId", paymentId, "razorpaySignature", sign(rzpOrderId + "|" + paymentId, TEST_KEY_SECRET));

        // Another customer cannot verify (or even see) this order
        String other = newCustomer();
        assertThat(post("/api/payments/verify", other, verifyBody).status()).isEqualTo(404);
        assertThat(get("/api/orders/" + orderId, other).status()).isEqualTo(404);

        assertThat(post("/api/payments/verify", customer, verifyBody).status()).isEqualTo(200);
        JsonNode paid = get("/api/orders/" + orderId, customer).data();
        assertThat(paid.path("paymentStatus").asText()).isEqualTo("PAID");
        assertThat(paid.path("orderStatus").asText()).isEqualTo("CONFIRMED");
        assertThat(stockOf(productId)).isEqualTo(8);
        assertThat(get("/api/cart", customer).data().path("items").size()).isZero();

        // Replay of the same callback does not take stock again
        assertThat(post("/api/payments/verify", customer, verifyBody).status()).isEqualTo(200);
        assertThat(stockOf(productId)).isEqualTo(8);

        // Paid orders cannot be paid again or cancelled by the customer
        assertThat(post("/api/payments/initiate/" + orderId, customer, null).status()).isEqualTo(400);
        assertThat(post("/api/orders/" + orderId + "/cancel", customer, null).status()).isEqualTo(400);

        // Revenue reflects the verified order
        assertThat(get("/api/admin/analytics", admin).data().path("totalRevenue").decimalValue())
                .isGreaterThanOrEqualTo(new java.math.BigDecimal("1050.00"));
    }

    @Test
    void webhookRequiresValidSignatureAndIsIdempotent() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Webhook Test Mat", "1200.00", null, 4);
        String customer = newCustomer();
        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 1));
        long orderId = post("/api/orders", customer, Map.of("shippingAddress", address())).data().path("id").asLong();
        JsonNode init = post("/api/payments/initiate/" + orderId, customer, null).data();
        String rzpOrderId = init.path("razorpayOrderId").asText();
        long amount = init.path("amountInPaise").asLong();

        String body = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_WH1\",\"order_id\":\""
                + rzpOrderId + "\",\"amount\":" + amount + ",\"status\":\"captured\"}}}}";

        Resp forged = call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/payments/webhook")
                .header("X-Razorpay-Signature", "deadbeef"), null, body);
        assertThat(forged.status()).isEqualTo(401);
        assertThat(get("/api/orders/" + orderId, customer).data().path("paymentStatus").asText()).isEqualTo("PENDING");

        for (int i = 0; i < 2; i++) {
            Resp ok = call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/payments/webhook")
                    .header("X-Razorpay-Signature", sign(body, TEST_WEBHOOK_SECRET)), null, body);
            assertThat(ok.status()).isEqualTo(200);
        }
        assertThat(get("/api/orders/" + orderId, customer).data().path("paymentStatus").asText()).isEqualTo("PAID");
        assertThat(stockOf(productId)).isEqualTo(3);
    }

    @Test
    void stockShortageAtPaymentTimeCancelsInsteadOfOverselling() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Last Item Painting", "2000.00", null, 1);
        String a = newCustomer();
        String b = newCustomer();
        post("/api/cart/items", a, Map.of("productId", productId, "quantity", 1));
        post("/api/cart/items", b, Map.of("productId", productId, "quantity", 1));
        long orderA = post("/api/orders", a, Map.of("shippingAddress", address())).data().path("id").asLong();
        long orderB = post("/api/orders", b, Map.of("shippingAddress", address())).data().path("id").asLong();

        payInFull(a, orderA);
        payInFull(b, orderB);

        assertThat(get("/api/orders/" + orderA, a).data().path("orderStatus").asText()).isEqualTo("CONFIRMED");
        JsonNode lateOrder = get("/api/orders/" + orderB, b).data();
        assertThat(lateOrder.path("orderStatus").asText()).isEqualTo("CANCELLED");
        assertThat(lateOrder.path("paymentStatus").asText()).isEqualTo("PAID");
        assertThat(stockOf(productId)).isZero();
        assertThat(get("/api/admin/analytics", admin).data().path("refundsDueCount").asLong()).isGreaterThanOrEqualTo(1);
        assertThat(get("/api/products/id/" + productId, null).data().path("status").asText()).isEqualTo("OUT_OF_STOCK");
    }

    @Test
    void adminStatusTransitionsAreValidatedAndCancellationRestoresStock() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Transition Test Vase", "1500.00", null, 5);
        String customer = newCustomer();
        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 2));
        long orderId = post("/api/orders", customer, Map.of("shippingAddress", address())).data().path("id").asLong();

        // Unpaid order cannot be shipped or confirmed by hand
        assertThat(put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "SHIPPED")).status()).isEqualTo(400);
        assertThat(put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "CONFIRMED")).status()).isEqualTo(400);
        Resp bogus = put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "BOGUS"));
        assertThat(bogus.status()).isEqualTo(400);
        assertThat(bogus.message()).doesNotContain("com.ngo");

        payInFull(customer, orderId);
        assertThat(stockOf(productId)).isEqualTo(3);

        // Shipping requires a tracking number
        assertThat(put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "SHIPPED")).status()).isEqualTo(400);
        Resp packed = put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "PACKED"));
        assertThat(packed.status()).isEqualTo(200);
        assertThat(packed.data().path("allowedNextStatuses").toString()).contains("SHIPPED", "CANCELLED");

        Resp cancelled = put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "CANCELLED"));
        assertThat(cancelled.status()).isEqualTo(200);
        assertThat(stockOf(productId)).isEqualTo(5);

        // Cancelled -> refunded is allowed (records refund); cancelled -> shipped is not
        assertThat(put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "SHIPPED", "trackingNumber", "X")).status())
                .isEqualTo(400);
        Resp refunded = put("/api/admin/orders/" + orderId + "/status", admin, Map.of("orderStatus", "REFUNDED"));
        assertThat(refunded.data().path("paymentStatus").asText()).isEqualTo("REFUNDED");
    }

    @Test
    void customerCanCancelUnpaidOrder() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Cancel Test Tray", "250.00", null, 5);
        String customer = newCustomer();
        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 1));
        long orderId = post("/api/orders", customer, Map.of("shippingAddress", address())).data().path("id").asLong();

        assertThat(post("/api/orders/" + orderId + "/cancel", newCustomer(), null).status()).isEqualTo(404);
        Resp r = post("/api/orders/" + orderId + "/cancel", customer, null);
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.data().path("orderStatus").asText()).isEqualTo("CANCELLED");
        assertThat(post("/api/payments/initiate/" + orderId, customer, null).status()).isEqualTo(400);
        assertThat(stockOf(productId)).isEqualTo(5);
    }

    @Test
    void checkoutValidatesAddressAndEmptyCart() throws Exception {
        String customer = newCustomer();
        assertThat(post("/api/orders", customer, Map.of("shippingAddress", address())).status()).isEqualTo(400);
        assertThat(post("/api/orders", customer, Map.of("shippingAddress", Map.of("fullName", "x"))).status()).isEqualTo(400);
        assertThat(post("/api/orders", customer, "{not json").status()).isEqualTo(400);
    }

    // ------------------------------------------------------------------ admin catalogue

    @Test
    void deletingAnOrderedProductArchivesItAndHidesItFromTheShop() throws Exception {
        String admin = adminToken();
        long productId = createProduct(admin, "Archive Test Frame", "800.00", null, 5);
        String slug = get("/api/admin/products/" + productId, admin).data().path("slug").asText();
        String customer = newCustomer();
        post("/api/cart/items", customer, Map.of("productId", productId, "quantity", 1));
        post("/api/orders", customer, Map.of("shippingAddress", address()));

        Resp del = delete("/api/admin/products/" + productId, admin);
        assertThat(del.status()).isEqualTo(200);
        assertThat(del.message()).contains("archived");
        assertThat(get("/api/products/" + slug, null).status()).isEqualTo(404);
        assertThat(get("/api/admin/products/" + productId, admin).data().path("status").asText()).isEqualTo("INACTIVE");
        assertThat(get("/api/admin/products?status=INACTIVE", admin).data().path("totalElements").asInt()).isGreaterThanOrEqualTo(1);
        // Order history still renders the product snapshot
        assertThat(get("/api/orders", customer).data().get(0).path("items").get(0).path("productName").asText())
                .isEqualTo("Archive Test Frame");

        // A never-ordered product is deleted outright
        long unused = createProduct(admin, "Unused Product", "100.00", null, 1);
        assertThat(delete("/api/admin/products/" + unused, admin).message()).contains("deleted");
        assertThat(get("/api/admin/products/" + unused, admin).status()).isEqualTo(404);
    }

    @Test
    void productValidationRejectsBadPricing() throws Exception {
        String admin = adminToken();
        long categoryId = get("/api/categories", null).data().get(0).path("id").asLong();
        Resp r = post("/api/admin/products", admin, Map.of("name", "Bad", "price", "100", "discountPrice", "150",
                "sku", "BAD-1", "stockQuantity", 1, "categoryId", categoryId));
        assertThat(r.status()).isEqualTo(400);
        Resp neg = post("/api/admin/products", admin, Map.of("name", "Bad", "price", "-1",
                "sku", "BAD-2", "stockQuantity", 1, "categoryId", categoryId));
        assertThat(neg.status()).isEqualTo(400);
    }

    @Test
    void categoryWithProductsCannotBeDeleted() throws Exception {
        String admin = adminToken();
        long categoryId = get("/api/categories", null).data().get(0).path("id").asLong();
        assertThat(delete("/api/admin/categories/" + categoryId, admin).status()).isEqualTo(409);

        Resp created = post("/api/admin/categories", admin, Map.of("name", "Empty Test Category", "description", "d"));
        assertThat(created.status()).isEqualTo(200);
        assertThat(post("/api/admin/categories", admin, Map.of("name", "empty test category")).status()).isEqualTo(400);
        assertThat(delete("/api/admin/categories/" + created.data().path("id").asLong(), admin).status()).isEqualTo(200);
    }

    @Test
    void cmsContentRoundTripsToPublicPages() throws Exception {
        String admin = adminToken();
        Resp c1 = post("/api/admin/campaigns", admin, Map.of("title", "Same Title", "description", "d", "targetAmount", 1000));
        Resp c2 = post("/api/admin/campaigns", admin, Map.of("title", "Same Title", "description", "d", "targetAmount", 1000));
        assertThat(c1.status()).isEqualTo(200);
        assertThat(c2.status()).isEqualTo(200);
        assertThat(c2.data().path("slug").asText()).isNotEqualTo(c1.data().path("slug").asText());
        assertThat(get("/api/campaigns/" + c1.data().path("slug").asText(), null).status()).isEqualTo(200);

        Resp metric = post("/api/admin/impact/metrics", admin, Map.of("title", "Test Metric", "value", 12, "unit", "u"));
        assertThat(metric.status()).isEqualTo(200);
        long metricId = metric.data().path("id").asLong();
        put("/api/admin/impact/metrics/" + metricId, admin, Map.of("title", "Test Metric", "value", 13, "unit", "u", "active", false));
        assertThat(get("/api/impact/metrics", null).data().toString()).doesNotContain("Test Metric");

        Resp draft = post("/api/admin/stories", admin, Map.of("title", "Draft Story", "excerpt", "e", "content", "c", "published", false));
        assertThat(get("/api/stories/" + draft.data().path("slug").asText(), null).status()).isEqualTo(404);

        Resp ann = post("/api/admin/announcements", admin, Map.of("title", "Hello", "content", "Banner text", "linkUrl", "/shop"));
        assertThat(ann.status()).isEqualTo(200);
        assertThat(get("/api/announcements", null).data().toString()).contains("Banner text");
        assertThat(post("/api/admin/announcements", admin, Map.of("title", "x", "content", "y", "linkUrl", "javascript:alert(1)")).status())
                .isEqualTo(400);

        assertThat(post("/api/contact", null, Map.of("name", "N", "email", "n@x.org", "subject", "S", "message", "M")).status())
                .isEqualTo(200);
        JsonNode msgs = get("/api/admin/contact-messages?status=NEW", admin).data().path("content");
        assertThat(msgs.size()).isGreaterThan(0);
        assertThat(put("/api/admin/contact-messages/" + msgs.get(0).path("id").asLong() + "/status", admin,
                Map.of("status", "RESOLVED")).status()).isEqualTo(200);
    }

    private void payInFull(String customer, long orderId) throws Exception {
        String rzpOrderId = post("/api/payments/initiate/" + orderId, customer, null).data().path("razorpayOrderId").asText();
        String paymentId = "pay_" + orderId;
        Resp r = post("/api/payments/verify", customer, Map.of("orderId", orderId, "razorpayOrderId", rzpOrderId,
                "razorpayPaymentId", paymentId, "razorpaySignature", sign(rzpOrderId + "|" + paymentId, TEST_KEY_SECRET)));
        assertThat(r.status()).isEqualTo(200);
    }
}
