# Repair Audit — NGO Impact E-Commerce Platform

Audit date: 2026-10-10. Auditor: Claude (engineering agent), at the request of the repository owner.

## 1. What was found on disk

| Item | Finding |
|---|---|
| Project root | `C:\Users\Rohan\ngo project` |
| Version control | **None.** The folder was not a git repository, so there is no commit history, branch history, or deleted-file history to recover from. A baseline snapshot of the untouched code was committed as `06d32f6` on `main` before any edits; repairs happen on branch `repair/stabilization`. |
| Other evidence | `.freebuff/project-id` (an AI code-generator project marker), a stale `frontend/dist` build, a stale `backend/target/classes` build. Both stale builds match the current sources' structure — no older/different feature set was recoverable from them. |
| Frontend | `frontend/` — React 18 + Vite 5 + TypeScript 5 (strict), Tailwind 3, TanStack Query 5, Zustand 4, React Router 6, Axios, lucide-react. |
| Backend | `backend/` — Java 17, Spring Boot 3.2.4, Spring Security (stateless JWT, jjwt 0.11.5, BCrypt), Spring Data JPA/Hibernate, Bean Validation, Razorpay Java SDK 1.4.6, Lombok. |
| Database | PostgreSQL via env vars; **default is in-memory H2** (`jdbc:h2:mem:ngodb`) — every restart wiped all users, carts and orders. Schema managed by `ddl-auto: update` (no migration tool). |
| Seed data | `config/DataInitializer.java` — seeds only when `users` is empty (idempotent). |
| Payment | Razorpay (order create on server, HMAC signature verify). Webhook secret configured but **no webhook endpoint existed**. |
| Email | None (no provider, no dependency, no code). |
| Image storage | None — images are external URLs only (Unsplash stock photos in seed data). No upload endpoint. |
| Tests | **None** in either backend or frontend. No test directories, no test scripts. |
| Build tooling | `mvnw.cmd` present but the `mvnw` shell script is missing and the wrapper's 3.9.6 distribution folder is empty (failed download). A complete Maven 3.9.16 exists in `~/.m2/wrapper/dists/`. Node 24 / npm 11. PostgreSQL is **not installed** (installer only in Downloads). |

### Catalogue / NGO source material
The repair brief references **Adivasi Yuva Seva Sangh** and the **AYUSH Warli Painting product catalogue** (fields: serial no., brand, manufacturer, title, HSN, GST, price, description, size, material, colour, images, SKU, listing status).
**None of this material exists in the repository or anywhere searched on this machine** (project folder, Downloads, Desktop, Documents, OneDrive, Pictures — searched for warli/ayush/adivasi/bamboo/handicraft/catalog). The repository is branded **"Aasha Foundation"** and its seed catalogue is 4 generic invented products with Unsplash stock images, invented impact metrics (15,400 meals, 3,200 artisans, 50,000 trees, 1,850 students), an invented campaign, and an invented beneficiary story ("Sunita Devi").

Consequences for this repair:
- No real catalogue can be restored because none is available. A repeatable **CSV catalogue import** supporting the AYUSH field set was added so the real catalogue can be loaded when supplied (see progress log).
- Invented seed content was kept (so the site is usable) but is now **explicitly labelled as demo content** and can be switched off (`APP_SEED_DEMO_DATA=false`).
- Hard-coded unverifiable claims in the UI ("Fair-Wage Certified", "Verified NGO Partner", "Supporting over 3,200 rural families", "100% Eco-Friendly", etc.) were removed or neutralised.
- The brand name (Aasha vs. Adivasi Yuva Seva Sangh) was **not** changed — that is an owner decision (see Open Questions).

## 2. Architecture (as found)

```
Browser ──> Vite dev server :5173 ──(/api proxy)──> Spring Boot :8080 ──> H2 (mem) / PostgreSQL
                │                                        │
                └── checkout.razorpay.com script         └── Razorpay REST (orders.create)
```

- Auth: `POST /api/auth/login|register` → JWT (HS256, 24h) stored in `localStorage`; Axios interceptor adds `Bearer`. Roles: CUSTOMER, ADMIN, SUPER_ADMIN, STAFF. URL rule `/api/admin/**` + `@PreAuthorize` on admin controllers.
- Cart: server-side per authenticated user (`carts`, `cart_items`). **No guest cart** exists anywhere in the code (no localStorage cart, no anonymous cart id) — guest users must sign in to add to cart. This is the established design and was preserved.
- Order flow: `POST /api/orders` (server recomputes prices, 5% GST, ₹99 shipping under ₹999) → `POST /api/payments/initiate/{orderId}` → Razorpay modal → `POST /api/payments/verify` → order CONFIRMED/PAID, stock decremented, cart cleared.

## 3. Baseline results (before any change)

| Check | Result |
|---|---|
| `mvn compile` | PASS |
| `tsc --noEmit` | PASS |
| Backend start (H2) | PASS, seed ran |
| Public GET endpoints (products, featured, slug, categories, campaigns, metrics, projects, stories, announcements, search, sort) | all 200 |
| Customer login, add to cart, create order, initiate payment | 200 |

### Defects reproduced against the running baseline

| # | Severity | Defect (reproduced) | Root cause |
|---|---|---|---|
| D1 | **Critical** | `POST /payments/verify` with signature `"fake"` → order marked **PAID / CONFIRMED** | `PaymentService.verifyPayment` skips rejection when the key secret is the placeholder; frontend `executeDemoPaymentVerification` sends fake ids whenever the Razorpay modal is dismissed or the script is missing. A fake payment flow. |
| D2 | **Critical** | A *different* customer could call verify on someone else's order, and calling verify twice decremented stock twice (43 → 41) | No ownership check, no idempotency, no check that `razorpayOrderId` matches the stored payment. |
| D3 | High | `initiatePayment` swallows every Razorpay exception and returns a made-up `rzp_ord_…` id | Empty `catch` block. |
| D4 | High | Internal exception text leaks to clients (Hibernate SQL, constraint names, enum class names) | `GlobalExceptionHandler.handleGeneralException` returns `ex.getMessage()`. |
| D5 | High | `GET /products?sortBy=hacked` → 500 with JPQL in message | No whitelist for sort fields. |
| D6 | High | Admin **delete product** that was ever in a cart/order → 500 FK violation | Hard delete of referenced rows. |
| D7 | High | All data lost on every backend restart | Default datasource is in-memory H2. |
| D8 | High | Admin "Impact Metrics" form never saves | Frontend posts to `/api/admin/impact/metrics` on a client whose base is already `/api` → `/api/api/...` 404. |
| D9 | Medium | Admin can set any order status incl. `DELIVERED → PENDING`; unknown status → 500 | No transition rules, `valueOf` unguarded. |
| D10 | Medium | Second campaign/story with the same title → 500 | Slug uniqueness not handled. Editing a story via save also nulls `publishedAt`/`createdAt`. |
| D11 | Medium | Login with differently-cased email fails although register lowercases | Login not normalised. |
| D12 | Medium | Unauthenticated calls return 403 instead of 401; expired tokens never log the user out | No authentication entry point; Axios 401 handler is a no-op. |
| D13 | Medium | CORS allows any origin with credentials | `setAllowedOriginPatterns("*")` ignores the configured `app.cors.allowed-origins`. H2 console exposed with `web-allow-others: true`. |
| D14 | Medium | Tax stored/returned with 4 decimals (`59.9000`) | No rounding. |

### Defects found by code reading (frontend)

| # | Defect | Root cause |
|---|---|---|
| F1 | Wishlist hearts never show saved state; clicking a saved product adds it again | `useWishlistStore` is never populated or updated. |
| F2 | Guest clicking "Add" silently does nothing | 401/403 swallowed with `console.error`; no redirect to login. No user-visible errors for any cart failure (e.g. out of stock). |
| F3 | Cart drawer shows list price, not the discounted price actually charged | Renders `item.price`. |
| F4 | Home "Support This Initiative" → blank page | Links to `/campaigns/:slug`; no such route. No 404 route at all. |
| F5 | Shop has no search box; navbar search while already on `/shop` doesn't update results; result count shows page size not total; no pagination (hard cap 20) | `ProductFilter` ignores `searchQuery`; state initialised once from URL. |
| F6 | Admin product list hides INACTIVE/OUT_OF_STOCK products (can't be re-enabled); same for categories, campaigns, unpublished stories | Admin pages read public endpoints that filter to active only. No admin list endpoints. |
| F7 | Admin cannot edit categories, campaigns, metrics, stories, or set product status/multiple images, despite backend support for some | Missing UI. |
| F8 | Checkout pre-fills a fake address ("123 Peace Green Avenue, New Delhi") | Hard-coded demo data. |
| F9 | Logout keeps cart badge/wishlist from previous user | Stores not cleared. |
| F10 | Contact form failure shows nothing | Error swallowed. |
| F11 | Announcement banner hard-coded; `/api/announcements` never used | Not wired. |
| F12 | Unpaid (PENDING) orders cannot be paid later or cancelled by the customer | No UI or endpoint. |

### Implemented-but-unreachable backend features (evidence of intended scope)
- `Address` entity + `AddressRepository` (saved addresses) — no service/controller/UI.
- `ContactMessage` with status workflow NEW/IN_PROGRESS/RESOLVED — saved but no admin view.
- `ImpactProject` save endpoint — no admin UI.
- `Announcement` entity — public read endpoint, no UI, no admin.
- `RAZORPAY_WEBHOOK_SECRET` config — no webhook endpoint.
- `PaymentRepository.findByRazorpayOrderId` — unused (webhook lookup).
- `Order.OrderStatus.REFUNDED`, `PaymentStatus.REFUNDED` — no workflow.

## 4. Repair sequence (executed in this order)

1. Foundation: persistent H2 default, safe error handling, 401 entry point, CORS from config, H2 console locked down.
2. Payments: real signature verification only, ownership + idempotency + row locking, no fake ids, webhook endpoint, frontend demo-payment path removed, retry/cancel for pending orders.
3. Orders: status transition rules, stock restore on cancellation, rounding.
4. Catalogue: sort whitelist, archive-instead-of-delete, admin list endpoints, extended catalogue fields (HSN/GST/material/size/colour/brand/manufacturer/source serial/listing status), CSV import with non-destructive upsert.
5. Customer UX: wishlist state, auth-aware add-to-cart with errors, discounted prices, shop search/pagination/URL sync, campaign detail route, 404 page, addresses, pending-order payment.
6. Admin: edit flows, metrics/projects/announcements/contact messages, order details.
7. Content honesty: demo labelling, removal of unverifiable claims.
8. Tests: backend integration tests (MockMvc + H2), API end-to-end script, production builds.

## 5. Open questions for the owner (cannot be resolved from the repository)

1. **Which NGO is this site for?** Code says "Aasha Foundation"; the brief says Adivasi Yuva Seva Sangh. Rebranding is a find-and-replace over ~10 components plus `application.yml` `app.ngo.*` once confirmed.
2. **The AYUSH Warli catalogue file and product photos** — please add them (e.g. `data/catalogue.csv` + images). The importer is ready.
3. **Real NGO contact details, registration info, impact figures** — currently placeholders from the generator.
4. **Razorpay test/live keys** and webhook secret.
5. **Tax model** — code charges a flat 5% GST on top of price. If catalogue prices are GST-inclusive or per-HSN rates apply, this needs a decision.
