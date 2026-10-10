# AASHA Foundation — NGO Impact-Driven E-Commerce Platform

An e-commerce storefront for an NGO's artisan products, combined with impact storytelling (metrics, field projects, campaigns, stories), Razorpay payments, role-based access control and an admin operations dashboard.

> **Status:** repaired and stabilised — see [`docs/REPAIR_AUDIT.md`](docs/REPAIR_AUDIT.md), [`docs/FEATURE_PARITY_MATRIX.md`](docs/FEATURE_PARITY_MATRIX.md) and [`docs/REPAIR_PROGRESS.md`](docs/REPAIR_PROGRESS.md).
> The bundled products, figures and story are **demo data** (labelled as such on the site). Load the NGO's real catalogue with **Admin → Products → Import CSV**.

## DISCOVER → SHOP → SUPPORT → SEE THE IMPACT

## Technology Stack

**Frontend** — React 18 + Vite 5 + TypeScript (strict), Tailwind CSS, lucide-react, TanStack Query v5 (server state), Zustand (session/cart/wishlist mirrors), React Router v6, Axios. Tests: Vitest + Testing Library.

**Backend** — Java 17, Spring Boot 3.2.4, Spring Security (stateless JWT, BCrypt, roles `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`, `STAFF`), Spring Data JPA / Hibernate, Bean Validation, Razorpay Java SDK. Database: file-based H2 by default, PostgreSQL via environment variables. Tests: Spring Boot MockMvc integration tests on in-memory H2.

## Project Structure

```
ngo-project/
├── frontend/
│   └── src/
│       ├── api/            # Axios client, error helpers, 401 handling
│       ├── components/     # common, shop, cart, layouts, pages/{public,customer,admin}
│       ├── hooks/          # useShopActions (cart/wishlist), useSiteInfo
│       ├── lib/            # formatting helpers, Razorpay checkout helper
│       ├── routes/         # AppRoutes, ProtectedRoute, AdminRoute
│       ├── store/          # Zustand stores (auth, cart, wishlist, toasts)
│       └── types/
├── backend/
│   └── src/
│       ├── main/java/com/ngo/impact/
│       │   ├── config/      # DataInitializer (demo seed, admin bootstrap)
│       │   ├── controller/  # public, customer and admin REST controllers
│       │   ├── dto/  entity/  exception/  repository/  security/
│       │   ├── payment/     # PaymentGateway + RazorpayGateway
│       │   └── service/     # business logic incl. CatalogueImportService
│       └── test/java/...    # integration tests
├── scripts/e2e-smoke.mjs    # live API journey through the dev proxy
├── docs/                    # audit, feature matrix, progress log
└── .env.example
```

## Running Locally

Prerequisites: Java 17, Node 18+ (tested with Node 24), Maven 3.9+ (or the wrapper, see note).

### 1. Backend (port 8080)
```bash
cd backend
mvn spring-boot:run          # or: mvnw.cmd spring-boot:run  (Windows)
```
Data is stored in `backend/data/` (H2 file) and survives restarts. On an empty database the demo seed creates labelled sample content and two demo accounts:

| Role | Email | Password |
|---|---|---|
| Customer | `customer@ngo.org` | `customer123` |
| Admin | `admin@ngo.org` | `admin123` |

For a real deployment set `APP_SEED_DEMO_DATA=false`, `APP_ADMIN_EMAIL` / `APP_ADMIN_PASSWORD`, and a strong `JWT_SECRET` (see `.env.example`).

> **Maven wrapper note:** if `mvnw.cmd` fails, delete `%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6-bin` (an incomplete earlier download) so the wrapper downloads Maven again, or use an installed `mvn`.

**PostgreSQL:** set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_DRIVER=org.postgresql.Driver`, `HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect`. Tables are created/updated automatically (`ddl-auto: update`).

### 2. Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
The dev server proxies `/api` to `http://localhost:8080`, so no frontend environment variables are needed locally.

### 3. Payments
Without Razorpay credentials the checkout clearly reports that online payment is not configured; it never simulates a successful payment. To enable it, set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test-mode keys from the Razorpay dashboard), and for robustness configure a webhook to `https://<host>/api/payments/webhook` with `RAZORPAY_WEBHOOK_SECRET` (events `payment.captured`, `order.paid`, `payment.failed`).

## Tests and Builds
```bash
cd backend  && mvn test             # 19 integration tests
cd frontend && npm test             # 15 unit/component tests
cd frontend && npm run build        # type-check + production bundle in frontend/dist
node scripts/e2e-smoke.mjs          # with backend (fresh demo DB) + `npm run dev` running: 68 live checks
cd backend  && mvn -DskipTests package   # runnable jar in backend/target
```

## Payment Flow (Razorpay)
1. `POST /api/orders` — server prices the cart (discounts, 5% GST, ₹99 shipping below ₹999 — configurable) and stores an unpaid order with price/name snapshots. A repeated submit for the same cart reuses that order.
2. `POST /api/payments/initiate/{orderId}` — creates (or reuses) the Razorpay order for the exact amount.
3. Browser opens Razorpay Checkout.
4. `POST /api/payments/verify` — HMAC-SHA256 signature check with the key secret, ownership and order-id match. Then, under row locks and exactly once: payment → SUCCESS, order → PAID/CONFIRMED, stock decremented, purchased lines removed from the cart. If stock ran out meanwhile, the order is cancelled and flagged "refund due" instead of overselling.
5. Recovery: the signed webhook and the customer's "Check payment status" button (`/api/payments/reconcile/{id}`) confirm payments if the browser closed.

## Catalogue Import
Admin → Products → **Import CSV** (UTF-8). Required column: `SKU`. Recognised headers include Sr. No., Brand, Manufacturer, Product Title, HSN Code, GST, Selling Price, Discount Price, Description, Size, Material, Colour, Image (URLs separated by `|`), Upload/Listing Status, Category, Stock. Rows are matched on SKU; blank cells never overwrite stored values; unknown columns are preserved as extra product details; use **Dry run** to validate first. **Export CSV** downloads the current catalogue.

## Security Notes
- Passwords hashed with BCrypt; JWT secret must be overridden in production.
- All `/api/admin/**` endpoints require a staff role on the server; customers can only access their own carts, addresses and orders.
- Client prices are never trusted; totals are computed on the server.
- Error responses never include stack traces or SQL; CORS is limited to `CORS_ALLOWED_ORIGINS`; the H2 console is disabled by default.
