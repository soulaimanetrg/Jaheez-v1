# 05. Backend Endpoint Map

This document maps all API endpoints in the JAHEEZ platform, listing both the legacy monolith (`scripts/admin-api.js`) and the restructured Express backend (`backend/`).

---

## 1. REST API Routing Map

| Method | Path | Component | File Source | Auth | Roles | DB Tables Touched | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/admin-api/login` | Admin Auth | Monolith | No | None | `admins`, `admin_login_attempts` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/me` | Admin Profile | Monolith | Yes (Admin JWT) | None | `admins` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/dashboard` | Dashboard KPIs | Monolith | Yes (Admin JWT) | super_admin, operations, finance | `orders`, `users`, `drivers`, `stores` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/orders` | Order Listing | Monolith | Yes (Admin JWT) | super_admin, operations, finance | `orders` | **WORKING (LEGACY)** |
| **PATCH** | `/admin-api/orders/:id` | Order Dispatch | Monolith | Yes (Admin JWT) | super_admin, operations | `orders` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/stores` | Store Config | Monolith | Yes (Admin JWT) | super_admin, operations, content_manager | `stores` | **WORKING (LEGACY)** |
| **POST** | `/admin-api/stores` | Store Create | Monolith | Yes (Admin JWT) | super_admin, operations | `stores` | **WORKING (LEGACY)** |
| **PATCH** | `/admin-api/stores/:id` | Store Edit | Monolith | Yes (Admin JWT) | super_admin, operations | `stores` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/users` | Customer Admin | Monolith | Yes (Admin JWT) | super_admin, operations, support | `users` | **WORKING (LEGACY)** |
| **PATCH** | `/admin-api/users/:id` | Customer Edit | Monolith | Yes (Admin JWT) | super_admin, operations | `users` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/drivers` | Driver Catalog | Monolith | Yes (Admin JWT) | super_admin, operations | `drivers` | **WORKING (LEGACY)** |
| **PATCH** | `/admin-api/drivers/:id` | Driver Edit | Monolith | Yes (Admin JWT) | super_admin, operations | `drivers` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/support` | Support Admin | Monolith | Yes (Admin JWT) | super_admin, support | `support_requests` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/promotions` | Promo Admin | Monolith | Yes (Admin JWT) | super_admin, operations, content_manager | `promotions` (Local PG) | **WORKING (LEGACY)** |
| **POST** | `/admin-api/validate-promo`| Promo Check | Monolith | No | None | `promotions` (Local PG) | **WORKING (LEGACY)** |
| **POST** | `/admin-api/stripe/checkout-session`| Stripe Payment | Monolith | No | None | `orders` | **RISKY (LEGACY BYPASS)** |
| **GET** | `/admin-api/stripe/session/:id`| Stripe Callback | Monolith | No | None | `orders` (Updates status to `paid`) | **RISKY (LEGACY BYPASS)** |
| **POST** | `/admin-api/auth/register` | User Signup | Monolith | No | None | `users` (Supabase via service_role) | **WORKING (LEGACY)** |
| **POST** | `/admin-api/auth/login` | User Email Prep | Monolith | No | None | `users` (Supabase via service_role) | **WORKING (LEGACY)** |
| **POST** | `/admin-api/otp/send` | Send OTP SMS | Monolith | No | None | In-memory OTP cache | **WORKING (LEGACY)** |
| **POST** | `/admin-api/otp/verify` | Verify OTP SMS | Monolith | No | None | In-memory OTP cache | **WORKING (LEGACY)** |
| **GET** | `/admin-api/refunds` | Refund Listing | Monolith | Yes (Admin JWT) | super_admin, finance | `refunds` (Local PG) | **WORKING (LEGACY)** |
| **POST** | `/admin-api/wallets/:user_id/adjust`| Wallet Adjust | Monolith | Yes (Admin JWT) | super_admin, finance | `wallets`, `wallet_transactions` | **WORKING (LEGACY)** |
| **POST** | `/admin-api/driver/login` | Driver Signin | Monolith | No | None | `drivers` | **WORKING (LEGACY)** |
| **GET** | `/admin-api/driver/me` | Driver Profile | Monolith | Yes (Driver JWT)| None | `drivers` | **WORKING (LEGACY)** |
| **PATCH** | `/admin-api/driver/me` | GPS Telemetry | Monolith | Yes (Driver JWT)| None | `drivers` (Bypasses Redis geo index) | **RISKY (NO TELEMETRY)** |
| **POST** | `/admin-api/driver/orders/:id/claim`| Claim offer | Monolith | Yes (Driver JWT)| None | `orders` | **WORKING (LEGACY)** |
| **POST** | `/admin-api/driver/orders/:id/stage`| Stage Update | Monolith | Yes (Driver JWT)| None | `orders` | **WORKING (LEGACY)** |
| **POST** | `/admin-api/driver/payouts`| Payout Create | Monolith | Yes (Driver JWT)| None | `payout_requests` | **WORKING (LEGACY)** |
| **POST** | `/admin-api/cod-settlements`| COD Settle | Monolith | Yes (Admin JWT) | super_admin, finance | `cod_settlements`, `drivers` | **WORKING (LEGACY)** |
| **POST** | `/admin-api/v1/checkout` | Cart checkout | MVC Backend | Yes (User JWT) | None | `orders`, `order_items`, `wallets` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/payments/stripe/checkout-session`| Stripe Create | MVC Backend | Yes (User JWT) | None | `orders` | **UNROUTED (PORT 3001)** |
| **GET** | `/admin-api/v1/payments/stripe/session/:sessionId`| Stripe Verify | MVC Backend | Yes (User JWT) | None | `orders` (Updates status to `paid`) | **UNROUTED (PORT 3001)** |
| **PATCH**| `/admin-api/v1/customer/profile`| Edit Profile | MVC Backend | Yes (User JWT) | None | `users` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/profile`| Upsert Profile| MVC Backend | Yes (User JWT) | None | `users` | **UNROUTED (PORT 3001)** |
| **GET** | `/admin-api/v1/customer/addresses`| List Address | MVC Backend | Yes (User JWT) | None | `user_addresses` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/addresses`| Create Address| MVC Backend | Yes (User JWT) | None | `user_addresses` | **UNROUTED (PORT 3001)** |
| **DELETE**| `/admin-api/v1/customer/addresses/:id`| Delete Address| MVC Backend | Yes (User JWT) | None | `user_addresses` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/favorites/toggle`| Toggle Fav | MVC Backend | Yes (User JWT) | None | `favorites` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/support-tickets`| Help Ticket | MVC Backend | Yes (User JWT) | None | `support_requests` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/orders/custom`| Custom Order | MVC Backend | Yes (User JWT) | None | `orders` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/orders/:orderId/chat`| Send Chat | MVC Backend | Yes (User JWT) | None | `chat_messages` | **UNROUTED (PORT 3001)** |
| **POST** | `/admin-api/v1/customer/orders/:orderId/reviews`| Submit Review| MVC Backend | Yes (User JWT) | None | `reviews` (Crashes: should be `store_reviews`) | **UNROUTED (DB CRASH)** |

---

## 2. API Proxy Routing Rules (`scripts/proxy.js`)
*   **Routing Logic**: Intercepts `/admin-api/*` paths and routes them directly to Port 3001 (`ADMIN_API_PORT`).
*   **Restructured Backend Exclusion**: No rules forward traffic to the restructured backend. Since the restructured backend defaults to Port 3001, running both causes port conflict. Moving the restructured backend to Port 3002 leaves it unrouted.

