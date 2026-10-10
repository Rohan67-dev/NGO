# Repair Progress Log

Branch: `repair/stabilization` (baseline snapshot of the untouched code: commit `06d32f6` on `main`).
See `REPAIR_AUDIT.md` for findings and `FEATURE_PARITY_MATRIX.md` for per-feature status.

## Stage A — Baseline (done)
- Inventoried repository; no git history, no tests, no catalogue file on the machine.
- Baseline: backend compiles, frontend type-checks, backend starts; 14 defects reproduced against the running baseline (D1–D14) plus 12 found by reading the frontend (F1–F12).
- Created a local git repo and baseline commit so every change is reviewable/reversible.

## Stage B/C — Backend (commit `afc7586`)
Files: `security/*`, `exception/*`, `payment/*` (new), `service/*`, `controller/**`, `dto/*`, `entity/Product.java`, `repository/*`, `config/DataInitializer.java`, `resources/application.yml`.
- **Payments (D1–D3):** `PaymentGateway`/`RazorpayGateway` abstraction; HMAC verification always enforced (constant-time); ownership checks; provider-order matching; idempotent `markPaid` under `PESSIMISTIC_WRITE` locks on order and products; stock shortage → order cancelled + "refund due"; signed webhook `/api/payments/webhook`; `/payments/failure`, `/payments/reconcile/{id}`, `/payments/config`; no fabricated `rzp_ord_*` ids; 503 when credentials are missing.
- **Orders (D9, D14):** 2-dp rounding; config-driven shipping/tax; duplicate-checkout reuse; admin transition table; tracking required to ship; cancel restores stock for paid orders; refund recording; customer cancel; admin search/filter; 404 for non-owners.
- **Catalogue (D5, D6):** sort whitelist; storefront shows ACTIVE + OUT_OF_STOCK, hides INACTIVE; stock/status sync; archive-instead-of-delete; admin listing of all statuses; catalogue fields + `extraAttributes`; related products; price/stock filters; `CatalogueImportService` (CSV upsert on SKU, dry run, no blank overwrites, row-level errors) and CSV export.
- **Cart:** owned-item lookups, server-side shipping/tax/total, availability flags, `saveAndFlush` so new lines carry ids, remove only purchased lines after payment.
- **CMS:** real update semantics (load-then-modify), unique slugs, delete endpoints, admin "list all" endpoints, announcements + contact inbox admin API, published-only stories.
- **Accounts:** email normalisation (D11), profile update, password change, address book API, deactivated accounts can't use old tokens.
- **Foundation (D4, D7, D12, D13):** file-based H2 default; generic 500s with server logging; 401 vs 403; CORS from `CORS_ALLOWED_ORIGINS`; H2 console off; `/api/site/info` from `app.ngo.*`; demo seed labelled and switchable, admin bootstrap from env, partial-seed rollback.

### Bugs found by the new tests and fixed
- JPQL nested-enum literal broke context startup → string literals.
- Rejected signature's FAILED status was rolled back by the exception → `noRollbackFor = PaymentException`.

## Stage C — Frontend (commit `4f807d6`, + fixes in final commit)
- Fake payment fallback removed; `lib/razorpay.ts` runs the real checkout and only reports success after server verification; cancel/fail keep the order payable.
- Shared `useShopActions` hook (sign-in redirect, toasts, wishlist sync); toast system; wishlist store loaded on login; logout clears private state.
- Shop URL-driven filters, search box, price/stock filters, pagination, real counts; product page catalogue details, related products, Buy Now only after successful add; campaign detail page; 404 page; scroll-to-top on navigation.
- Checkout with saved addresses, server totals, unavailable-item blocking, payment availability notice; account page with orders (pay/cancel/check status), profile, password, addresses.
- Admin: product form (status, catalogue fields, multiple images), CSV import/export, category edit/hide/delete, order details + allowed transitions, campaign/metric/project/story CRUD, announcements, messages, mobile admin nav; fixed `/api/api/...` metric URL.
- Removed unverifiable claims (fair-wage certification, "verified" badges, 3,200 families, 100% transparency); contact details from server config; policies split per type and marked draft; mismatched hero stock photo replaced by a real shop product image.

### Bug found by the browser pass and fixed
- `App.tsx` called `queryClient.clear()` on mount for guests, orphaning every query → home/shop empty for visitors. Now resets only on an actual logout. Regression test added (verified to fail on the old code).

## Tests executed (final run)

| Suite | Command | Result |
|---|---|---|
| Backend integration (MockMvc + H2) | `cd backend && mvn test` | **19 passed**, 0 failed |
| Frontend unit/component | `cd frontend && npm test` | **15 passed**, 0 failed |
| Frontend type-check + production build | `npm run build` | **passed** |
| Live E2E via Vite proxy (`scripts/e2e-smoke.mjs`, 35 customer + 30 admin + 3 hardening checks) | `node scripts/e2e-smoke.mjs` (needs a fresh demo-seeded DB) | **68 passed**, 0 failed |
| Restart persistence | restart backend on same DB | **passed** (1 order, 3 customers, 5 products retained; seed skipped) |
| Manual Chrome pass | home, shop search, login redirect, product, add to cart, drawer totals, checkout, admin dashboard/orders/products | **passed** after the App.tsx fix; phone-width check **not done** (window could not be resized) |

## Outstanding issues
1. Online payment success path has not been exercised against Razorpay (no keys). Logic is covered by integration tests with a stubbed order-creation call and real HMAC checks.
2. Real NGO catalogue/images/content not available — demo data still in place (labelled).
3. Brand name (Aasha vs Adivasi Yuva Seva Sangh) undecided.
4. Not implemented (no evidence in code): product variants, stock history, customer management, image upload, password reset/email.
5. `npm run lint` fails (ESLint never installed) — pre-existing.
6. Maven wrapper: `mvnw.cmd`'s cached 3.9.6 distribution folder at `%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6-bin` is empty; delete that folder so the wrapper re-downloads, or run an installed Maven.
7. Refunds are recorded, not executed — issue them in the Razorpay dashboard.
8. Schema is managed by `ddl-auto: update` (pre-existing). Adopt Flyway before production on PostgreSQL.

## External configuration still required
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (+ webhook URL in Razorpay dashboard), `JWT_SECRET` (production), `DATABASE_URL`/credentials for PostgreSQL, `NGO_NAME/EMAIL/PHONE/ADDRESS`, `APP_ADMIN_EMAIL/PASSWORD` and `APP_SEED_DEMO_DATA=false` for a real deployment, the catalogue CSV and product photos, policy text.

## Next steps (for a follow-up session)
1. Obtain Razorpay test keys; run checkout end-to-end in a browser with test card/UPI; configure the webhook.
2. Import the AYUSH catalogue CSV via Admin → Products → Import CSV (dry run first); host images and reference them by URL.
3. Decide branding and replace NGO texts; set `APP_SEED_DEMO_DATA=false` on a fresh database.
4. Add Flyway baseline migration before moving to PostgreSQL.
