# Security Audit Report

## Verdict

**Status**: **INSECURE / HIGH RISK**

The JAHEEZ system contains severe security design flaws. Although it runs structured JWT verification for Express routers, it is compromised by a complete lack of Stripe webhook validation, widespread direct frontend Supabase reads and writes that bypass the Express MVC logic, rate-limit bypasses, and hardcoded JWT secrets.

---

## Vulnerabilities

### 1. Client-Initiated Stripe Session Verification (No Webhook signature validation)
- **Severity**: CRITICAL
- **Impacted Files**: 
  - [checkout.controller.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/order/checkout.controller.ts#L94)
  - [checkout.service.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/order/checkout.service.ts#L330)
  - [customerOrder.routes.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/order/customerOrder.routes.ts#L30)
- **Why it breaks**: The Express backend does not implement Stripe webhooks to verify payment status asynchronously. Instead, the backend relies on a client-initiated GET request (`/v1/payments/stripe/session/:sessionId`) after redirecting back to the app. 
- **Exploit / Failure Risk**:
  1. If a customer pays successfully on Stripe but immediately closes the tab, loses network connectivity, or experiences a client-side crash, the order will remain in `pending` (unpaid) state forever, even though the customer was charged.
  2. If the Stripe integration key is exposed or there is any loophole in how Stripe sessions are validated (e.g., matching sessionId to user), a client could spoof successful payments or request multiple validations.
- **Reproduction Steps**:
  1. Initiate an order with the payment method set to `card`.
  2. Complete the payment on Stripe's hosted checkout page.
  3. Close the browser tab immediately before being redirected back to the user application.
  4. Note that the order remains stuck in `pending` status on the backend and is never auto-confirmed.
- **MVC + Service-Layer Fix**:
  Implement a POST `/v1/payments/stripe/webhook` endpoint on the backend. This route must:
  1. Receive the raw webhook request from Stripe.
  2. Verify the webhook signature (`stripe.webhooks.constructEvent`) using a secret `STRIPE_WEBHOOK_SECRET`.
  3. Extract the `order_id` and `user_id` from the session's metadata.
  4. Transition the order status securely via `OrderLifecycleService.transitionOrder` to `confirmed` and update payment status to `paid` inside a database transaction.

---

### 2. Direct Frontend Supabase Reads & Writes (RLS Bypassing)
- **Severity**: CRITICAL
- **Impacted Files**:
  - [orderApi.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/user-app/features/orders/services/orderApi.ts#L25) (Reads `orders` and `chat_messages` directly)
  - [storeApi.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/user-app/features/stores/services/storeApi.ts#L213) (Reads `stores`, `menu_categories`, `store_reviews`, `favorites`, `favorite_products`)
  - [addresses.tsx](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/user-app/app/(flows)/addresses.tsx#L40) (Reads and writes `user_addresses` directly)
  - [walletApi.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/user-app/features/wallet/services/walletApi.ts#L39) (Reads `wallets` and `wallet_transactions` directly)
- **Why it breaks**: Bypasses the unified Express MVC backend layer. All reads and some writes are conducted directly by instantiating the client-side Supabase SDK and invoking `.from('table')` queries. 
- **Exploit / Failure Risk**:
  1. Bypasses backend-level validations, logging, rate limits, and audit logs.
  2. If Row-Level Security (RLS) is misconfigured or disabled on any of these tables, clients can perform unauthorized reads, or execute malicious writes (such as updating order statuses, draining wallet balances, or altering reviews).
- **Reproduction Steps**:
  1. Intercept client traffic or use the anon key of Supabase in a standalone script.
  2. Construct a direct SQL/Supabase client mutation to update `user_addresses` or toggle other users' favorites.
- **MVC + Service-Layer Fix**:
  Migrate all client reads and writes to backend REST API endpoints:
  1. Route all addresses CRUD operations to `/v1/customer/addresses`.
  2. Route all order detail fetches to `/v1/customer/orders/:id`.
  3. Route all store and review fetches to structured store routes protected by the MVC backend.
  4. Keep the Supabase client-side keys strictly restricted to authentication and session management.

---

### 3. Rate Limiter Mounted After Routes
- **Severity**: HIGH
- **Impacted Files**:
  - [app.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/app.ts#L31)
- **Why it breaks**: In Express, middleware registration order determines execution order. The `apiLimiter` rate-limiting middleware is registered *after* all key routers (auth, store, checkout, driver, customer, admin, settings, finance, support).
- **Exploit / Failure Risk**:
  Since matching routes send responses and terminate the request-response cycle before reaching line 40 in `app.ts`, the rate limiter is **never** executed for active endpoints. This leaves the system open to auth brute-forcing, OTP spamming, and API denial-of-service (DDoS) attacks.
- **Reproduction Steps**:
  1. Write a script to send 1,000 rapid POST requests to `/admin-api/auth/login`.
  2. Observe that all requests receive standard responses and are never blocked with HTTP 429 Too Many Requests.
- **MVC + Service-Layer Fix**:
  Re-register the middleware inside [app.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/app.ts):
  ```typescript
  // Mount rate limiting before mounting any routes
  app.use('/admin-api', apiLimiter);

  app.use('/admin-api', authRouter);
  app.use('/admin-api', storeRouter);
  // ...
  ```

---

### 4. JWT Secret Key Hardcoding & Lack of Rotation
- **Severity**: MEDIUM
- **Impacted Files**:
  - [jwt.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/utils/jwt.ts)
  - [supabaseJwt.middleware.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/middleware/supabaseJwt.middleware.ts)
- **Why it breaks**: Uses static JWT verification keys and environment variables without key rotation or fallback mechanisms.
- **Exploit / Failure Risk**: If a secret is leaked, all role claims (Customer, Driver, Admin) can be forged by attackers to gain full system access.
- **MVC + Service-Layer Fix**:
  Use a secure key management system or configure a rotational middleware that signs and verifies JWT tokens against a revolving set of keys.

---

## JWT Boundary Verdict

| Actor | Status | Evidence & Risk |
|---|---|---|
| **Customer** | **INSECURE** | Supabase JWT is passed to backend for checkouts, but reads/writes to `user_addresses`, `wallets`, and `orders` bypass MVC entirely. |
| **Driver** | **PARTIAL** | Driver JWT role boundaries exist on the Express backend, but the client does not establish a secure Socket connection to sync status. |
| **Admin** | **RISKY** | Admin JWT and roles (`super_admin`, `operations`, `finance`, `support`) are validated in Express middleware, but direct db queries could bypass these restrictions if RLS fails. |
| **Finance** | **PARTIAL** | Wallet balance adjustments and COD settlements are logged via `AuditLogService`, but commission payout endpoints throw errors. |
| **Super Admin** | **RISKY** | Possesses access to audit logs and admin creation endpoints, but static configurations pose credentials compromise risk. |
