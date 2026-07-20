# 04. Architecture Gap Analysis

This document identifies the technical gaps between the current implementation and the target MVC architecture.

---

## 1. Identified Architecture Gaps

### GAP 01: Unrouted MVC Backend & Port Conflict
*   **Current Problem**: Both the legacy backend (`scripts/admin-api.js`) and the restructured backend (`backend/src`) default to port `3001` (causing collision). The proxy (`scripts/proxy.js`) routes ALL `/admin-api/*` traffic to Port `3001`, leaving the new MVC backend completely unrouted and bypassed.
*   **Why Dangerous**: The new MVC code receives zero traffic; the system runs entirely on the legacy monolith.
*   **Files Involved**:
    *   [scripts/proxy.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/proxy.js)
    *   [backend/src/config/env.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/config/env.ts)
*   **Required Refactor**: Change the restructured backend port (e.g. to `3002`) and update `scripts/proxy.js` to route all non-Vite/non-Metro API traffic to the restructured backend.
*   **Priority**: **P0**

### GAP 02: Supabase to Local DB Mismatch (Table Desyncs)
*   **Current Problem**: The new backend repositories query tables from Supabase client (`supabase.from(...)`) that only exist in the monolith's local PostgreSQL database. Specifically:
    1.  `promotions` queried in `checkout.repository.ts` line 111.
    2.  `admin_login_attempts` queried in `auth.repository.ts` line 53.
    3.  `reviews` (name mismatch) queried in `customer.repository.ts` line 156 (table is actually named `store_reviews` in Supabase).
*   **Why Dangerous**: The new backend will crash at runtime on checkout with promo code, admin login, or user review submission.
*   **Files Involved**:
    *   [backend/src/repositories/checkout.repository.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/repositories/checkout.repository.ts)
    *   [backend/src/repositories/auth.repository.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/repositories/auth.repository.ts)
    *   [backend/src/repositories/customer.repository.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/repositories/customer.repository.ts)
*   **Required Refactor**: Re-run migrations or update the database to host all these tables on Supabase (with appropriate RLS). Fix the `reviews` repository model to reference `store_reviews`.
*   **Priority**: **P0**

### GAP 03: Missing Socket.IO Client on Mobile Apps
*   **Current Problem**: The restructured backend mounts a secured Socket.IO server on Port 3001/3002. However, neither `user-app` nor `driver-app` contains `socket.io-client` in their package dependencies or any client-side socket connection code. They still rely entirely on direct client-to-Supabase Realtime WAL subscriptions.
*   **Why Dangerous**: Telemetry updates bypass the API and JWT role/room authorizations, querying PG WAL directly from client devices.
*   **Files Involved**:
    *   `user-app/package.json`
    *   `driver-app/package.json`
    *   `user-app/lib/orderApi.ts`
*   **Required Refactor**: Install `socket.io-client` on clients. Connect with JWT auth handshake. Replace Supabase Realtime subscriptions with Socket.IO room listeners (`order:{id}`).
*   **Priority**: **P0**

### GAP 04: Missing Location Telemetry on Driver App
*   **Current Problem**: The `driver-app` has zero code to watch location or send heartbeats. In addition, the location updates it does patch via profile update are directed to the legacy monolith on port 3001, which has no Redis integration.
*   **Why Dangerous**: Active driver lists and geographical closest-driver matching algorithms on the backend are non-functional due to empty Redis caches.
*   **Files Involved**:
    *   `driver-app/app/(tabs)/index.tsx`
    *   `driver-app/lib/api.ts`
    *   [scripts/admin-api.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/admin-api.js)
*   **Required Refactor**: Implement background geolocation/heartbeat loop in the driver app using `expo-location`. Route updates directly to the restructured backend.
*   **Priority**: **P0**

### GAP 05: Stripe Legacy Bypass Risk
*   **Current Problem**: If `LEGACY_STRIPE_ROUTES_ENABLED === 'true'`, the legacy monolith exposes `/admin-api/stripe/checkout-session` which accepts client-supplied `amount_centimes` directly from requests, introducing a price tampering vulnerability.
*   **Why Dangerous**: Malicious users can pay arbitrarily low amounts (e.g., 1 MAD) and force payment status to `paid`.
*   **Files Involved**:
    *   [scripts/admin-api.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/admin-api.js) line 3000-3055
*   **Required Refactor**: Disable the legacy Stripe endpoint by forcing `LEGACY_STRIPE_ROUTES_ENABLED = false` and clean up the routes.
*   **Priority**: **P0**

### GAP 06: Direct Supabase Reads on Client Apps
*   **Current Problem**: While direct writes are moved to the REST API, client apps still query Supabase directly for reads (e.g. wallets, support requests, order history, active favorites).
*   **Why Dangerous**: Exposes the database URL and keys to the client, preventing backend caching, analytics, or security filtering of queries.
*   **Files Involved**:
    *   `user-app/lib/walletApi.ts`
    *   `user-app/lib/storeApi.ts`
    *   `user-app/lib/orderApi.ts`
*   **Required Refactor**: Introduce REST API read endpoints on the backend and transition clients to fetch them via HTTP.
*   **Priority**: **P1**

