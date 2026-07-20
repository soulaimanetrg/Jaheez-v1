# Security Vulnerabilities Report

This document reports critical security design flaws and vulnerabilities identified in the JAHEEZ system codebase.

---

## 1. Client-Initiated Stripe Session Verification (No Webhooks)

* **Exact File Path**: 
  * `backend/src/features/order/checkout.controller.ts` (line 94)
  * `backend/src/features/order/checkout.service.ts` (line 330)
  * `backend/src/features/order/customerOrder.routes.ts` (line 31)
* **Exact Function/Component**: `verifyStripeSession`
* **Root Cause**: The backend does not implement Stripe webhooks to verify payment status asynchronously. Instead, it relies on the frontend app initiating a GET request `/admin-api/v1/payments/stripe/session/:sessionId` upon returning to the app's success URL.
* **Severity**: CRITICAL
* **Exploit / Risk**:
  1. **Order Abandonment**: If a user pays successfully on Stripe but closes the tab, loses battery/network, or suffers a client-side crash before redirection occurs, the backend is never notified. The order remains in `pending` (unpaid) status forever, even though the customer's card was charged.
  2. **Payment Spoofing**: Since the confirmation relies entirely on client-driven queries, there is an increased risk of payment intent spoofing or manipulation if session retrieval validation fails to strictly compare all metadata parameters.
* **Exact Fix**:
  Implement a POST `/v1/payments/stripe/webhook` route in Express. This endpoint must:
  1. Receive raw payloads directly from Stripe.
  2. Verify the webhook signature using `stripe.webhooks.constructEvent` and a secure `STRIPE_WEBHOOK_SECRET`.
  3. Inspect the event type `checkout.session.completed`.
  4. Extract metadata containing the `order_id` and `user_id`.
  5. Atomically mark the order status as `confirmed` and payment status as `paid` within a SQL transaction via the service layer.

---

## 2. API Rate Limiter Bypass

* **Exact File Path**: `backend/src/app.ts` (lines 31-40)
* **Exact Function/Component**: App-level middleware registration order
* **Root Cause**: In Express, middleware is executed sequentially. The `apiLimiter` middleware is mounted *after* all major feature routers (auth, store, checkout, driver, customer, admin, settings, finance, support).
* **Severity**: HIGH
* **Exploit / Risk**:
  Because matching routes send HTTP responses and terminate the request-response cycle, the rate-limiting middleware is **never** reached for any active API endpoints. Attackers can brute-force login credentials, flood the server with OTP requests, or perform Denial of Service (DoS) attacks on expensive checkout routes without getting rate-limited.
* **Exact Fix**:
  Move the `apiLimiter` middleware registration *before* all router declarations in `backend/src/app.ts`:
  ```typescript
  // 1. Mount rate limiting first
  app.use('/admin-api', apiLimiter);

  // 2. Mount API routers
  app.use('/admin-api', authRouter);
  app.use('/admin-api', storeRouter);
  // ...
  ```

---

## 3. Direct Frontend Supabase Reads & Writes (Bypassing Express MVC)

* **Exact File Path**: 
  * `frontend/user-app/app/(flows)/addresses.tsx` (line 40)
  * `frontend/user-app/features/orders/services/orderApi.ts`
  * `frontend/user-app/features/stores/services/storeApi.ts`
* **Exact Function/Component**: Client-side API fetching modules
* **Root Cause**: The client application instantiates the Supabase JS SDK directly and reads tables (e.g. `user_addresses`, `orders`, `stores`, `menu_items`) bypassing the Express MVC API layer.
* **Severity**: CRITICAL
* **Exploit / Risk**:
  1. **Access Control Leaks**: Bypasses backend middleware checks, logging, input sanitization, and audit logs.
  2. **RLS Configuration Dependency**: Security relies entirely on PostgreSQL Row-Level Security (RLS) rules. If a developer misconfigures or accidentally disables RLS on a table, all client apps (using the public anon key) can read, update, or delete records globally across the entire database.
* **Exact Fix**:
  Migrate all client reads and writes to structured endpoints on the Express MVC backend:
  1. Replace direct read of `user_addresses` in `addresses.tsx` with a request to `GET /v1/customer/addresses`.
  2. Restrict the client-side Supabase SDK permissions to authentication session management only.

---

## 4. Hardcoded JWT Secrets

* **Exact File Path**: 
  * `backend/src/utils/jwt.ts`
  * `backend/src/middleware/supabaseJwt.middleware.ts`
* **Exact Function/Component**: JWT verification utilities
* **Root Cause**: The application signs and verifies JWT payloads using static secret strings loaded from `.env` without any rotation mechanisms or key verification logic.
* **Severity**: MEDIUM
* **Exploit / Risk**: If the static JWT secret (`ADMIN_JWT_SECRET` or `SUPABASE_JWT_SECRET`) is leaked or compromised, an attacker can forge JWT signatures to impersonate customers, drivers, or administrators, gaining full access to administrative control flows.
* **Exact Fix**:
  Implement asymmetric token signing using public/private key pairs (RS256) or integrate a key rotation system to revolvingly sign and verify tokens.
