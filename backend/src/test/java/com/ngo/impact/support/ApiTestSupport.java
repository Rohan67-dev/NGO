package com.ngo.impact.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ngo.impact.payment.RazorpayGateway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Small helpers so the integration tests read like the real API calls the frontend makes. */
public abstract class ApiTestSupport {

    public static final String TEST_KEY_SECRET = "unit_test_key_secret";
    public static final String TEST_WEBHOOK_SECRET = "unit_test_webhook_secret";
    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    protected record Resp(int status, JsonNode body) {
        public JsonNode data() {
            return body.path("data");
        }

        public String message() {
            return body.path("message").asText();
        }
    }

    protected Resp call(MockHttpServletRequestBuilder req, String token, Object body) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s ? s : json.writeValueAsString(body));
        }
        MvcResult r = mvc.perform(req).andReturn();
        String content = r.getResponse().getContentAsString();
        return new Resp(r.getResponse().getStatus(), content.isEmpty() ? json.createObjectNode() : json.readTree(content));
    }

    protected Resp get(String url, String token) throws Exception {
        return call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), token, null);
    }

    protected Resp post(String url, String token, Object body) throws Exception {
        return call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url), token, body);
    }

    protected Resp put(String url, String token, Object body) throws Exception {
        return call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(url), token, body);
    }

    protected Resp delete(String url, String token) throws Exception {
        return call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(url), token, null);
    }

    protected String login(String email, String password) throws Exception {
        Resp r = post("/api/auth/login", null, Map.of("email", email, "password", password));
        if (r.status() != 200) throw new IllegalStateException("login failed: " + r.body());
        return r.data().path("token").asText();
    }

    protected String adminToken() throws Exception {
        return login("admin@ngo.org", "admin123");
    }

    /** Registers a fresh customer and returns their token. */
    protected String newCustomer() throws Exception {
        String email = "cust" + SEQ.incrementAndGet() + "-" + UUID.randomUUID().toString().substring(0, 6) + "@test.org";
        Resp r = post("/api/auth/register", null, Map.of(
                "firstName", "Test", "lastName", "Customer", "email", email, "password", "secret123", "phone", "+91 90000 00000"));
        if (r.status() != 200) throw new IllegalStateException("register failed: " + r.body());
        return r.data().path("token").asText();
    }

    /** Creates an ACTIVE product via the admin API and returns its id. */
    protected long createProduct(String admin, String name, String price, String discountPrice, int stock) throws Exception {
        long categoryId = get("/api/categories", null).data().get(0).path("id").asLong();
        var body = new java.util.HashMap<String, Object>();
        body.put("name", name);
        body.put("price", price);
        body.put("discountPrice", discountPrice);
        body.put("sku", "TEST-" + UUID.randomUUID().toString().substring(0, 8));
        body.put("stockQuantity", stock);
        body.put("categoryId", categoryId);
        body.put("imageUrls", java.util.List.of("https://example.org/img.jpg"));
        Resp r = post("/api/admin/products", admin, body);
        if (r.status() != 200) throw new IllegalStateException("create product failed: " + r.body());
        return r.data().path("id").asLong();
    }

    protected Map<String, Object> address() {
        return Map.of("fullName", "Test Customer", "phone", "+91 90000 00000", "addressLine1", "1 Test Road",
                "city", "Pune", "state", "Maharashtra", "postalCode", "411001", "country", "India");
    }

    protected int stockOf(long productId) throws Exception {
        return get("/api/admin/products/" + productId, adminToken()).data().path("stockQuantity").asInt();
    }

    protected static String sign(String payload, String secret) {
        return RazorpayGateway.hmacSha256Hex(payload, secret);
    }
}
