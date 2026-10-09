# AASHA Foundation — NGO Impact-Driven E-Commerce Platform

A production-quality **NGO Impact-Driven E-Commerce Platform** combining commercial e-commerce, verified social impact storytelling, campaign transparency, real-time inventory management, Razorpay payments, role-based access control (RBAC), and enterprise Admin Operations Dashboard.

---

## 🌟 Core Concept: DISCOVER → SHOP → SUPPORT → SEE THE IMPACT

Every product purchased on the platform directly funds fair wages for rural artisans, smallholder farmers, and registered NGO social welfare initiatives.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom Design Tokens (Emerald & Amber Palette)
- **Icons**: Lucide React Icons
- **State Management**: TanStack Query v5 (Server State) + Zustand (Client Auth, Cart & Wishlist State)
- **Routing**: React Router v6
- **HTTP Client**: Axios with JWT Bearer Token Interceptor

### Backend
- **Framework**: Java 17 + Spring Boot 3.2.4
- **Security**: Spring Security + Stateless JWT + BCrypt Password Hashing + Role-Based Access Control (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`, `STAFF`)
- **Persistence**: Spring Data JPA + Hibernate
- **Database**: PostgreSQL (with automated fallback H2 database profile for zero-config local testing)
- **Payments**: Razorpay Java SDK + HMAC-SHA256 Server Signature Verification
- **Validation**: Bean Validation (Jakarta) + Global `@ControllerAdvice` Exception Handler

---

## 📦 Project Directory Structure

```
ngo-project/
├── frontend/                 # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── api/              # Axios HTTP client & interceptors
│   │   ├── components/       # Common, Shop, Cart, Impact, Checkout, Admin components
│   │   ├── layouts/          # MainLayout (Storefront) & AdminLayout (Sidebar operations)
│   │   ├── pages/            # Public, Customer, and Admin pages
│   │   ├── routes/           # AppRoutes, ProtectedRoute & AdminRoute guards
│   │   ├── store/            # Zustand stores (Cart, Auth, Wishlist)
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                  # Java 17 Spring Boot REST API Backend
│   ├── src/main/java/com/ngo/impact/
│   │   ├── config/           # SecurityConfig, DataInitializer (Seed Data)
│   │   ├── controller/       # Auth, Product, Category, Cart, Order, Payment, Admin controllers
│   │   ├── dto/              # Request/Response DTOs
│   │   ├── entity/           # JPA Entities (User, Product, Order, Payment, Campaign, ImpactMetric, Story)
│   │   ├── exception/        # GlobalExceptionHandler & custom exceptions
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   ├── security/         # JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal
│   │   └── service/          # Business logic services (OrderService, PaymentService, Inventory)
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
├── .env.example              # Documented environment configuration
└── README.md                 # Technical documentation
```

---

## 🔑 Pre-Seeded Demo Credentials

The platform automatically seeds realistic demo categories, products, active campaigns, impact metrics, beneficiary stories, and user accounts on startup:

| Account Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@ngo.org` | `customer123` | Shop catalog, Cart, Wishlist, Checkout, Track Orders |
| **Admin** | `admin@ngo.org` | `admin123` | Full Enterprise Admin Operations, Inventory, Order Status updates, CMS |

---

## 🚀 Commands to Run the Application

### 1. Frontend Setup & Run
```bash
cd frontend
cmd /c npm install
cmd /c npm run dev
```
The storefront will open at `http://localhost:5173`.

### 2. Backend Setup & Run (Java 17)
```bash
cd backend
java -cp "target/classes;target/dependency/*" com.ngo.impact.ImpactEcommerceApplication
```
or via Maven wrapper:
```bash
cd backend
./mvnw spring-boot:run
```
The REST API will run at `http://localhost:8080`.

---

## 💳 Payment Gateway Architecture (Razorpay)

1. **Order Creation**: Server locks historical item prices and creates pending Order record.
2. **Razorpay Initiation**: Backend returns `razorpay_order_id`, `key_id`, amount in paise to frontend.
3. **Checkout Modal**: Frontend launches official Razorpay Checkout window.
4. **Server Verification**: Frontend sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `/api/payments/verify`.
5. **HMAC Check**: Server verifies signature using `RAZORPAY_KEY_SECRET`. Upon success, order status becomes `CONFIRMED`, payment becomes `PAID`, inventory stock is reduced, and cart is cleared.

---

## 🛡️ Security & Integrity Highlights

- **No Plaintext Secrets**: Passwords hashed with BCrypt.
- **Client Price Isolation**: Product prices and order totals are computed server-side only. Client input is never trusted.
- **RBAC**: Admin endpoints are strictly protected with `@PreAuthorize("hasRole('ADMIN')")`.
