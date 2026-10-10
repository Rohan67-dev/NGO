# Feature Parity Matrix

Legend — **Initial status** (before repair) / **Final status** (after repair):
WORKING · PARTIALLY WORKING · BROKEN · MISSING · OBSOLETE · UNVERIFIABLE.
"Final: WORKING" means verified by at least one of: backend integration test (**BT**, `backend/src/test`), frontend test (**FT**, `frontend/src/**/*.test.ts*`), live API journey through the Vite proxy (**E2E**, 68 checks — see REPAIR_PROGRESS.md), or manual Chrome check (**UI**).

Evidence source for every feature is the code itself (no git history existed). "Missing" items were backed by unused entities/repositories/config in the original code, or by the repair brief.

## Customer — catalogue & discovery

| ID | Feature | Role | Route | Expected | Evidence | Initial | Root cause | Repair | Deps | Test | Final |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 | Home page sections (hero, metrics, featured, campaign, stories) | Visitor | `/` | Sections show DB content | Home.tsx | PARTIALLY WORKING | Fabricated claims hard-coded; campaign CTA linked to non-existent route | Removed unverifiable claims, metrics hidden when empty, hero uses a real product image | products, impact, campaigns, stories APIs | E2E C04, UI, FT App test | WORKING |
| F02 | Navigation (desktop) | Visitor | all | Links work, active state | Navbar.tsx | WORKING | — | Active link state, no-wrap labels | — | UI | WORKING |
| F03 | Mobile navigation | Visitor | all | Menu incl. search & account | Navbar.tsx | PARTIALLY WORKING | No search/account/logout on mobile | Added search, account, wishlist, sign-out | — | code review only | UNVERIFIABLE (window resize not possible in test browser) |
| F04 | Announcement banner | Visitor | all | Shows active announcement | Announcement entity + `/api/announcements` | BROKEN | Banner hard-coded; API never called | Navbar reads API | announcements API | E2E C02, UI, FT | WORKING |
| F05 | Product listing | Visitor | `/shop` | Paginated active products | Shop.tsx | PARTIALLY WORKING | Hard cap 20, count = page size | Pagination + server totals | products API | E2E, FT Shop test, UI | WORKING |
| F06 | Keyword search | Visitor | `/shop?query=` | Matches name/description | ProductRepository | PARTIALLY WORKING | No search box on Shop; navbar search ignored on /shop | URL-driven state, search box; also matches material & SKU | — | BT, E2E C05/C07, FT, UI | WORKING |
| F07 | Category filter | Visitor | `/shop` | Filter by category | ProductFilter | WORKING | — | Product counts, breadcrumb | — | E2E C06 | WORKING |
| F08 | Price / in-stock filters | Visitor | `/shop` | Filter by price range, stock | Brief §8.5 | MISSING | — | Added (server-side, effective price) | — | BT, E2E C06 | WORKING |
| F09 | Sorting | Visitor | `/shop` | Newest / price / name | ProductFilter | PARTIALLY WORKING | Arbitrary `sortBy` → 500 with JPQL leak | Whitelist; 400 on unknown | — | BT, E2E R01 | WORKING |
| F10 | Out-of-stock display | Visitor | `/shop`, product | Visible but not purchasable | Product.Status.OUT_OF_STOCK | BROKEN | OUT_OF_STOCK products disappeared from shop; status not kept in sync with stock | Visible as "Out of stock"; status auto-synced with stock | — | BT shortage test, E2E | WORKING |
| F11 | Product detail page | Visitor | `/product/:slug` | Images, price, description, qty, add/buy | ProductDetails.tsx | PARTIALLY WORKING | "Buy now" navigated even when add failed; inactive products still viewable; fabricated "Fair-Wage Certified" | Fixed; catalogue details table; breadcrumbs | — | E2E C08, A06, UI | WORKING |
| F12 | Image gallery | Visitor | product | Thumbnails switch image | ProductDetails.tsx | WORKING | — | Reset on product change, a11y labels | — | UI | WORKING |
| F13 | Related products | Visitor | product | Same-category products | Brief §8.4 | MISSING | — | `/products/{slug}/related` + section | — | E2E C09, UI | WORKING |
| F14 | Catalogue fields (HSN, GST, material, size, colour, brand, manufacturer, Sr. No., listing status, extra columns) | Visitor/Admin | product, admin | Shown & editable | Brief §8.3 | MISSING | Not in data model | Nullable columns + DTO + admin form + product page | — | BT import test, E2E A03/A04/A19 | WORKING |
| F15 | Product variants (size/colour options) | — | — | Select variant before adding | Brief §8.4 | MISSING (no evidence in code/data) | No variant model existed | Not implemented — colour/size stored as descriptive fields; needs real catalogue to design | — | — | MISSING (documented, needs owner input) |

## Customer — account, cart, checkout, orders

| ID | Feature | Role | Route | Expected | Evidence | Initial | Root cause | Repair | Deps | Test | Final |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F16 | Registration | Visitor | `/register` | Create account, auto sign-in | AuthController | WORKING | — | Confirm-password, visibility toggle, safe redirect | — | BT, E2E C12 | WORKING |
| F17 | Login | Visitor | `/login` | Sign in | AuthService | PARTIALLY WORKING | Case-sensitive email; open redirect via `?redirect=` | Normalised email, `safeRedirect`, password visibility | — | BT, E2E C13, FT, UI | WORKING |
| F18 | Session persistence / expiry | Customer | all | Stay signed in; expired token signs out | useAuthStore | PARTIALLY WORKING | 401 handler no-op; 403 returned for anonymous | 401 entry point; interceptor logs out | — | BT, FT | WORKING |
| F19 | Logout | Customer | navbar | Clear session & private state | useAuthStore | PARTIALLY WORKING | Cart/wishlist of previous user stayed visible | Stores and query cache reset | — | FT | WORKING |
| F20 | Forgot / reset password | Customer | — | Email reset link | Brief §8.7 | MISSING | No email provider in project | Not implemented (needs email service); login page says so honestly | Email provider | — | UNVERIFIABLE / MISSING (external dependency) |
| F21 | Profile edit & password change | Customer | `/profile?tab=profile` | Update name/phone, change password | Brief §8.7 | MISSING | — | `PUT /api/auth/me`, `/me/password` + UI | — | BT, E2E C34 | WORKING |
| F22 | Address book | Customer | `/profile?tab=addresses`, checkout | Save/edit/delete/default addresses | Address entity + repo (unused) | MISSING | No service/controller/UI | `/api/addresses` CRUD; checkout picker; "save address" | — | BT, E2E C29 | WORKING |
| F23 | Protected pages | Customer | `/profile`, `/checkout`, `/wishlist` | Redirect guests to login and back | ProtectedRoute | WORKING | — | Keeps query string | — | FT | WORKING |
| F24 | Wishlist add/remove/list | Customer | cards, `/wishlist` | Hearts reflect saved state | WishlistController | BROKEN | Store never populated → hearts always empty, toggling re-added | Store loaded on login, optimistic toggle, count badge | — | FT, E2E C15 | WORKING |
| F25 | Wishlist → cart | Customer | `/wishlist` | Add saved item to cart | Wishlist.tsx | WORKING | — | Errors surfaced | — | UI | WORKING |
| F26 | Add to cart | Customer | cards, product | Adds item, updates badge | CartService | PARTIALLY WORKING | Guests: silent failure; all errors swallowed | Sign-in redirect + error toasts; flush so new line has an id | — | BT, E2E C11/C16, UI | WORKING |
| F27 | Update quantity / remove / stock limits | Customer | cart drawer | Quantity bounded by stock | CartService | PARTIALLY WORKING | Other users' cart item ids returned 400 (existence leak); failures silent | Owned-item lookup (404), errors shown, + disabled at stock | — | BT, E2E C18/C19 | WORKING |
| F28 | Cart totals | Customer | drawer, checkout | Subtotal/shipping/GST/total agree with order | CartDrawer, OrderService | BROKEN | Drawer showed list price instead of charged discount price; totals computed in 2 places | Server computes shipping/GST/total for cart using order formula | — | BT, E2E C17/C20/C23, FT, UI | WORKING |
| F29 | Guest cart | Visitor | — | — | No guest cart anywhere in original code | OBSOLETE / not in scope | Original design requires sign-in | Kept; guests are redirected to sign in | — | E2E C11 | N/A (by design) |
| F30 | Unavailable items in cart | Customer | drawer, checkout | Flag & block checkout | Brief §8.6 | MISSING | — | `available` flags; checkout blocked | — | E2E A07/A08, FT | WORKING |
| F31 | Checkout address form & validation | Customer | `/checkout` | Validated address | Checkout.tsx | BROKEN | Pre-filled fake address; nested address not validated (`@Valid` missing) | Real address/picker; server validation incl. phone/PIN | — | BT, E2E C21 | WORKING |
| F32 | Order creation (server-priced) | Customer | `/checkout` | Order with server totals, price snapshot | OrderService | PARTIALLY WORKING | Tax unrounded (4 dp); duplicate orders on retry | Rounding; duplicate-checkout reuse | — | BT, E2E C22–C24 | WORKING |
| F33 | Razorpay payment | Customer | `/checkout` | Pay & verify | PaymentService, Checkout.tsx | BROKEN (critical) | Fake signatures accepted; frontend auto-"paid" on modal close | Real flow only; signature/ownership/idempotency/locking | Razorpay keys | BT (stubbed provider), E2E C25–C27 | WORKING (logic) / UNVERIFIABLE live (no Razorpay keys) |
| F34 | Payment cancel / failure / retry | Customer | checkout, `/profile` | Order stays payable; retry | Brief §8.10 | MISSING | — | `/payments/failure`, "Pay now" | Razorpay | BT | WORKING (logic) / UNVERIFIABLE live |
| F35 | Browser closed after payment | Customer | `/profile` | Recover paid state | Brief §8.10 | MISSING | — | Webhook + "Check payment status" reconcile | Razorpay keys, webhook secret | BT webhook test | WORKING (webhook logic) / UNVERIFIABLE live |
| F36 | Stock decrement & oversell protection | System | payment | Stock taken once, never negative | PaymentService | BROKEN | Double processing decremented twice; `max(0,…)` hid oversell | Row locks, idempotent, shortage → cancel + refund flag | — | BT | WORKING |
| F37 | Order confirmation | Customer | checkout | Confirmation after verified payment | Checkout.tsx | BROKEN | Shown after fake verification | Only after server verification; handles sold-out case | — | BT | WORKING (logic) / UNVERIFIABLE live |
| F38 | Order history & details | Customer | `/profile` | Orders with items, totals, address, status | Profile.tsx | PARTIALLY WORKING | Missing address/totals, no actions | Details, tracking, links | — | E2E C30, UI | WORKING |
| F39 | Customer cancel unpaid order | Customer | `/profile` | Cancel pending order | Brief §8.11 | MISSING | — | `/orders/{id}/cancel` | — | BT, E2E | WORKING |
| F40 | Order privacy (IDOR) | Customer | `/orders/{id}` | Only owner | OrderService | WORKING (403-ish) | Returned 400 "Unauthorized" (reveals existence) | 404 for non-owners | — | BT, E2E C31/C32 | WORKING |
| F41 | Tracking info | Customer | `/profile` | Carrier + tracking number | Order entity | WORKING | — | Kept | — | UI | WORKING |

## NGO content

| ID | Feature | Role | Route | Expected | Evidence | Initial | Root cause | Repair | Deps | Test | Final |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F42 | Impact portal (metrics, projects) | Visitor | `/impact` | Published metrics & projects | ImpactHub.tsx | PARTIALLY WORKING | "Verified field reports" claim; only 4 icons rendered | Honest wording, icon map, empty states | — | E2E A26 | WORKING |
| F43 | Campaign list | Visitor | `/campaigns` | Active campaigns | Campaigns.tsx | WORKING | — | Links to detail, empty/error states | — | E2E | WORKING |
| F44 | Campaign detail | Visitor | `/campaigns/:slug` | Detail page | Home linked to it; API existed | MISSING (dead link) | Route never defined | Page added (no donation flow — none in scope) | — | E2E A29 | WORKING |
| F45 | Donations | — | — | — | No donation code/entity | OBSOLETE / out of scope | — | Not added (brief: don't add financial workflows without evidence) | — | — | N/A |
| F46 | Stories list & detail | Visitor | `/stories`, `/stories/:slug` | Published stories | StoryController | PARTIALLY WORKING | Unpublished stories readable by slug; blank page on 404 | Published-only; not-found state | — | BT, E2E A27/A28 | WORKING |
| F47 | About page | Visitor | `/about` | Mission, vision | About.tsx | WORKING (content invented) | Unverifiable "100% financial transparency" | Replaced with link to Impact Portal | NGO text | UI | WORKING (content needs owner) |
| F48 | Contact form | Visitor | `/contact` | Submit message | ContactController | PARTIALLY WORKING | Errors swallowed; details hard-coded | Error display; details from config | — | BT, E2E C35 | WORKING |
| F49 | Policy pages | Visitor | `/policies/:type` | Privacy / terms / shipping | Policies.tsx | BROKEN | Same text for every policy; unverified claims | Per-policy content, marked as draft | NGO legal text | UI | PARTIALLY WORKING (draft content needs NGO approval) |
| F50 | Demo content labelling | — | seed | Not presented as real | DataInitializer | BROKEN | Invented stats/story/products presented as real | Labelled "Demo"; `APP_SEED_DEMO_DATA=false` disables | — | E2E C02 | WORKING |
| F51 | Real AYUSH Warli catalogue | — | — | Real products/images | Brief only | MISSING | File not present on machine | CSV importer ready (F60) | Catalogue file from owner | — | UNVERIFIABLE (input required) |

## Administration

| ID | Feature | Role | Route | Expected | Evidence | Initial | Root cause | Repair | Deps | Test | Final |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F52 | Admin access control | Admin | `/admin/*`, `/api/admin/*` | Staff only (server-enforced) | SecurityConfig, @PreAuthorize | WORKING | — | Proper 403 page; mobile nav | — | BT, E2E C33 | WORKING |
| F53 | Dashboard analytics | Admin | `/admin` | Real figures | AdminAnalyticsService | PARTIALLY WORKING | Revenue counted cancelled-paid orders; low stock counted archived products | Corrected; payment/refund/inbox alerts, status breakdown | — | BT, E2E A01, UI | WORKING |
| F54 | Product list (all statuses) | Admin | `/admin/products` | See inactive too | AdminProducts.tsx | BROKEN | Used public endpoint (ACTIVE only) → inactive products unrecoverable | `/api/admin/products` with search/status/pagination | — | BT, E2E A02, UI | WORKING |
| F55 | Product create/edit | Admin | `/admin/products` | All fields | AdminProducts.tsx | PARTIALLY WORKING | No status, single image, fabricated default impact text & stock image, SKU change ignored | Full form; validation (discount ≤ price) | — | BT, E2E A03/A11 | WORKING |
| F56 | Product delete | Admin | `/admin/products` | Safe delete | AdminProductController | BROKEN | FK violation 500 once in a cart/order | Archive if ordered, else delete; cleans carts/wishlists | — | BT, E2E A14/A16 | WORKING |
| F57 | Inventory management | Admin | product form | Stock persisted, status in sync | Product.stockQuantity | PARTIALLY WORKING | Status not synced; no low-stock list link | Auto OUT_OF_STOCK/ACTIVE; dashboard list | — | BT, E2E A03 | WORKING |
| F58 | Stock history / audit log | Admin | — | History of adjustments | Brief §10 | MISSING (no evidence in code) | — | Not implemented | — | — | MISSING (future enhancement) |
| F59 | Category CRUD | Admin | `/admin/categories` | Create/edit/hide/delete | CategoryService | PARTIALLY WORKING | No edit UI; hidden categories invisible to admin; no delete | Edit, hide/show, guarded delete (409 if products) | — | BT, E2E A10/A13/A15 | WORKING |
| F60 | Catalogue CSV import / export | Admin | `/admin/products` | Repeatable, non-destructive | Brief §8.3, §10 | MISSING | — | Upsert on SKU, dry run, row errors, extra columns kept, export | — | BT (3 tests), E2E A18–A20 | WORKING |
| F61 | Order list, search, filters | Admin | `/admin/orders` | Find orders | AdminOrders.tsx | PARTIALLY WORKING | Fixed 50, no search/filter | Search + filters + pagination | — | E2E A21, UI | WORKING |
| F62 | Order details | Admin | `/admin/orders` | Items, address, payment | Brief §10 | MISSING | — | Detail modal | — | UI | WORKING |
| F63 | Order status transitions | Admin | `/admin/orders` | Valid transitions only | OrderService | BROKEN | Any transition allowed (e.g. ship unpaid); bad value → 500 | Transition table, tracking required to ship, stock restore on cancel, refund recording | — | BT, E2E A22/A23 | WORKING |
| F64 | Refund execution | Admin | — | Refund via provider | PaymentStatus.REFUNDED | MISSING | — | Refund *recorded* only; money must be refunded in Razorpay dashboard | Razorpay | BT | PARTIALLY WORKING (manual refund step) |
| F65 | Campaign CMS | Admin | `/admin/campaigns` | Create/edit/delete | AdminCampaignController | PARTIALLY WORKING | Create only; duplicate title → 500 | Edit/delete/status/dates; unique slugs | — | BT, E2E A29 | WORKING |
| F66 | Impact metrics CMS | Admin | `/admin/impact` | Manage metrics | AdminImpact.tsx | BROKEN | Posted to `/api/api/...` (404) | Fixed URL; edit/hide/delete | — | BT, E2E A25/A26 | WORKING |
| F67 | Impact projects CMS | Admin | `/admin/impact` | Manage projects | saveProject endpoint (no UI) | MISSING | No UI | Added | — | BT | WORKING |
| F68 | Stories CMS | Admin | `/admin/stories` | Create/edit/draft/delete | AdminStories.tsx | PARTIALLY WORKING | Create only; editing wiped publish date | Full CRUD, drafts | — | BT, E2E A27/A28 | WORKING |
| F69 | Announcements CMS | Admin | `/admin/announcements` | Manage banner | Announcement entity | MISSING | No admin API/UI | Added (link validation blocks `javascript:`) | — | BT, E2E | WORKING |
| F70 | Contact inbox | Admin | `/admin/messages` | Read/resolve messages | ContactMessage status enum | MISSING | Saved but never shown | Added | — | BT, E2E A30 | WORKING |
| F71 | Customer management | Admin | — | List/search customers | Brief §10 | MISSING (no evidence in code) | — | Not implemented (customer count on dashboard only) | — | — | MISSING (future) |
| F72 | Image upload | Admin | — | Upload files | Brief §14 | MISSING (no evidence; URLs only) | No storage service | Not implemented; images are URLs | Storage service | — | MISSING (needs storage decision) |

## Platform / non-functional

| ID | Feature | Initial | Root cause | Repair | Test | Final |
|---|---|---|---|---|---|---|
| N01 | Data persistence across restarts | BROKEN | In-memory H2 default | File-based H2 default (`backend/data`), PostgreSQL via env | E2E restart check | WORKING |
| N02 | Safe error responses | BROKEN | Exception messages (SQL, class names) returned | Generic 500 + logging; specific 400/404/409/503 | BT, E2E R01/R02 | WORKING |
| N03 | CORS | BROKEN (insecure) | `*` with credentials | Configured origins | config review | WORKING |
| N04 | H2 console | BROKEN (insecure) | Enabled, `web-allow-others` | Disabled by default | config review | WORKING |
| N05 | Seeding idempotency | WORKING | — | Partial-seed rollback; skip when data exists | E2E restart | WORKING |
| N06 | Automated tests | MISSING | none existed | 19 backend + 15 frontend tests | — | WORKING |
| N07 | Maven wrapper | BROKEN | `mvnw` (sh) missing, 3.9.6 cache empty | Documented workaround | — | PARTIALLY WORKING (documented) |
| N08 | `npm run lint` | BROKEN | ESLint not installed/configured | Not changed (out of scope); documented | — | BROKEN (documented) |
| N09 | Favicon | BROKEN | `/favicon.svg` missing | Added | build | WORKING |
| N10 | Scroll position on navigation | BROKEN | Kept previous page scroll | ScrollToTop | UI | WORKING |
| N11 | Email notifications | MISSING | No provider | Not implemented | — | UNVERIFIABLE (external) |


## Final counts (83 rows: F01–F72 + N01–N11)

| Final classification | Count | Rows |
|---|---|---|
| Was working, kept working | 12 | F02, F07, F12, F16, F23, F25, F40, F41, F43, F47, F52, N05 |
| Repaired / restored, verified working | 53 | F01, F04–F06, F08–F11, F13, F14, F17–F19, F21, F22, F24, F26–F28, F30–F32, F36, F38, F39, F42, F44, F46, F48, F50, F53–F57, F59–F63, F65–F70, N01–N04, N06, N09, N10 |
| Repaired, verified by tests; live check blocked by missing Razorpay keys | 4 | F33, F34, F35, F37 |
| Partially working | 3 | F49 (draft policy text), F64 (refund recorded, issued manually in Razorpay), N07 (Maven wrapper) |
| Still broken | 1 | N08 (`npm run lint` – ESLint never installed) |
| Unverifiable (external input or environment) | 4 | F03 (mobile visual), F20 (password reset needs email service), F51 (real catalogue file), N11 (email) |
| Missing, no evidence in original code (future work) | 4 | F15 (variants), F58 (stock history), F71 (customer management), F72 (image upload) |
| Obsolete / out of scope by design | 2 | F29 (guest cart), F45 (donations) |
| **Total** | **83** | |
