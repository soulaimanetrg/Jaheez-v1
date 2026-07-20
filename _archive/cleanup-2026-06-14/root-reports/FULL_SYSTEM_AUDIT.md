# JAHEEZ Full System Audit

Date: 2026-06-10
Repository: `C:\Users\user\Desktop\jaheeez\Jaheez-v1`
Verdict: UNSAFE FOR RELEASE
Launch readiness score: 22 / 100

This audit is based on static code inspection and non-destructive build checks. It does not assume behavior from file names. Where a flow cannot be traced through UI -> communication -> controller -> service -> repository -> database, it is not marked working.

## Executive Verdict

JAHEEZ is not production-ready. It has pieces of a production architecture, but the actual platform is split between a legacy monolithic API (`scripts/admin-api.js`), a new MVC backend (`backend/src/**`) that does not compile, direct Supabase access from frontend apps, and mixed prototype directories. The strongest production risk is not one isolated bug; it is that there is no single enforced backend authority.

The store checkout path is partially improved through `POST /admin-api/v1/checkout`, but the system still has direct client-side database writes, client-side pricing/payment calculations, legacy API duplication, revenue-share driver finance, KYC/OTP remnants, and realtime claims that are mostly Supabase subscriptions rather than the required authenticated Socket.IO system.

## Architecture Scores

| Area | Score | Reason |
|---|---:|---|
| MVC Compliance | 38 / 100 | New backend has routes/controllers/services/repositories, but it does not compile and only covers a subset. Legacy `scripts/admin-api.js` still owns many production endpoints. |
| Layer Separation | 26 / 100 | Frontend and communication helpers perform totals, promo/payment flows, and direct Supabase writes. Legacy routes contain controller, service, repository, and finance logic in one file. |
| JWT Security | 45 / 100 | Tokens are separated by `kind` in several places, but legacy fallback accounts, unauthenticated payment/promo endpoints, and split auth implementations remain. |
| Backend Authority | 30 / 100 | Checkout is partly backend-authoritative, but custom orders, addresses, favorites, push token writes, chat, profile-like writes, and admin legacy operations bypass the target backend service layer. |
| Realtime Reliability | 20 / 100 | Socket.IO is installed/configured but not wired to a server. Realtime behavior is mostly direct Supabase subscriptions and polling/refetching. Redis heartbeat exists but is not an end-to-end dispatch/tracking system. |

## Build / Check Results

Backend build:

`npm.cmd run build` in `backend` fails. Evidence:

- `backend/src/controllers/checkout.controller.ts` imports `BadRequestError` from `../middleware/error.middleware`, but `backend/src/middleware/error.middleware.ts` exports only `errorHandler`.
- Same missing exports affect `BadRequestError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`, and `HttpError` imports across controllers/services/middleware.
- `backend/src/types/driver.types.ts` imports `shared/types.ts` outside backend `rootDir`, causing TS6059.

Admin build:

`npm.cmd run build` in `admin` fails in this sandbox with esbuild access/config resolution errors:

- `Cannot read directory "../../../..": Acces refuse.`
- `Could not resolve "...\admin\vite.config.ts"`

Mobile apps:

- `user-app` exposes only Expo start/android/ios/web scripts; no build/typecheck script.
- `driver-app` exposes only Expo start/web scripts; no build/typecheck script.

## Critical Issues

### 1. New MVC backend does not compile

- Category: Backend build
- Severity: CRITICAL
- Files: `backend/src/middleware/error.middleware.ts`, `backend/src/controllers/*.ts`, `backend/src/services/*.ts`, `backend/src/middleware/*.ts`, `backend/src/types/*.ts`
- Current behavior: `backend/src/app.ts` mounts the new routers under `/admin-api`, and `backend/src/server.ts` starts the server.
- Broken behavior: TypeScript build fails before deployment. The new backend cannot be treated as a production backend.
- Exact root cause: error classes are imported from `error.middleware.ts`, but are defined in `backend/src/utils/errors.ts` and not re-exported from middleware. Shared types are imported from outside backend `rootDir`.
- Violating layer: build/deployment layer; also controller/service layer imports are broken.
- Architectural violation: production route layer is not deployable, so the target layered architecture is only aspirational.
- Execution path: `scripts/proxy.js` routes selected `/admin-api/*` calls to `RESTRUCTURED_API_PORT = 3002`, but the backend default port is `3001` and the backend build fails.
- Recommended fix sequence: fix error imports or re-export errors; fix `tsconfig` root/include for `shared`; set backend `PORT` consistently to 3002 or change proxy; add CI build gate.
- Migration risk: Medium. Mostly compile/config work, but route ownership must be validated after fixing.
- Deployment risk: Critical. Current new backend cannot be deployed safely.
- Rollback risk: Low if only compile/config fixes are made; high if route ownership changes without tests.
- Production impact: checkout, driver orders, and order state endpoints can silently depend on the legacy monolith instead of the new backend.
- Priority: P0

### 2. Split backend authority between legacy monolith and new MVC backend

- Category: Architecture
- Severity: CRITICAL
- Files: `scripts/admin-api.js`, `scripts/proxy.js`, `backend/src/app.ts`, `backend/src/config/env.ts`, `admin/vite.config.ts`
- Current behavior: `scripts/admin-api.js` runs on `3001`; `scripts/proxy.js` sends a small allowlist of `/admin-api/*` routes to `3002`; `admin/vite.config.ts` proxies all `/admin-api` to `3001`; new backend defaults to port `3001`.
- Broken behavior: API ownership depends on which dev server/proxy path is used. The admin panel talks to the legacy backend by default.
- Exact root cause: no single API standard. `/admin-api/*` is shared by both old and new systems; `/api/v1/*` is not adopted.
- Violating layer: communication, controller, service, deployment.
- Architectural violation: target flow requires one controller/service/repository chain; current flow forks before the controller layer.
- Current flow: Frontend -> `/admin-api/*` -> Vite/proxy decision -> legacy monolith or new backend -> Supabase.
- Target flow: Frontend -> communication helper -> versioned controller -> service -> repository -> database.
- Recommended fix sequence: freeze legacy monolith; define `/api/v1/*` as the only production API; move all required legacy endpoints into MVC backend; remove proxy route guessing; update clients to one API base.
- Migration risk: High because admin and mobile currently call many legacy endpoints.
- Deployment risk: Critical until endpoint ownership is explicit.
- Rollback risk: Medium with a feature flag/proxy switch; high without endpoint parity tests.
- Production impact: different environments can execute different business logic for the same user action.
- Priority: P0

### 3. Frontend still writes directly to Supabase

- Category: Security / backend authority
- Severity: CRITICAL
- Files: `user-app/lib/orderApi.ts`, `user-app/app/(flows)/addresses.tsx`, `user-app/lib/storeApi.ts`, `user-app/app/(flows)/favorites.tsx`, `user-app/app/(flows)/chat/[id].tsx`, `user-app/hooks/usePushNotifications.ts`, `driver-app/app/(tabs)/profile.tsx`
- Current behavior: frontend apps use Supabase clients directly for inserts/updates/deletes.
- Broken behavior: required architecture forbids frontend database writes. RLS becomes the primary protection instead of backend service validation.
- Exact root cause: mobile clients were built as Supabase clients first, then partially migrated to backend calls.
- Violating layer: Frontend/UI and Communication Layer.
- Architectural violation: UI and helper layers skip Controller, Service, and Repository layers.
- Current flow examples:
  - Custom request: `custom-request.tsx` -> `createCustomOrder` -> `supabase.from('orders').insert(...)`.
  - Addresses: `addresses.tsx` -> `supabase.from('user_addresses').insert/update/delete(...)`.
  - Favorites: `storeApi.ts` / `favorites.tsx` -> `supabase.from('favorites').insert/delete(...)`.
  - Push token: `usePushNotifications.ts` -> `supabase.from('users').update({ push_token })`.
- Target flow: Frontend -> API helper -> controller -> service -> repository -> Supabase.
- Recommended fix sequence: add backend endpoints for custom orders, addresses, favorites, chat, push tokens, and driver document/profile writes; make helpers pure fetch wrappers; remove write access policies from frontend where possible.
- Migration risk: Medium-high due to many small UX flows.
- Deployment risk: High if RLS is tightened before replacement endpoints ship.
- Rollback risk: Medium; keep old policies temporarily behind monitoring.
- Production impact: tampering, inconsistent validation, and data corruption risks.
- Priority: P0

### 4. Payment amount is client-influenced

- Category: Payment integrity
- Severity: CRITICAL
- Files: `user-app/app/(flows)/checkout.tsx`, `user-app/lib/stripeClient.ts`, `scripts/admin-api.js`
- Current behavior: checkout screen computes `finalTotal` from cart state and sends `amount_centimes: Math.round(finalTotal * 100)` to `/admin-api/stripe/checkout-session`.
- Broken behavior: card payment amount can diverge from backend-created order total.
- Exact root cause: Stripe session creation accepts amount from the client instead of loading the order and computing payable amount server-side.
- Violating layer: Frontend/UI and Communication Layer.
- Architectural violation: secure payment amount is business logic and must live in Service layer.
- Current flow: Checkout UI -> `stripeClient.createStripeCheckoutSession(amount_centimes from UI)` -> legacy `/admin-api/stripe/checkout-session` -> Stripe.
- Target flow: Checkout UI -> API helper(order_id only) -> Payment controller -> Payment service loads order -> repository -> Stripe.
- Recommended fix sequence: change card session API to accept only `order_id`; server fetches order total/payment status; validate ownership; create Stripe session; add webhook signature verification and idempotent payment update.
- Migration risk: Medium.
- Deployment risk: Critical for public payments.
- Rollback risk: Medium; cash-only mode can be fallback.
- Production impact: underpayment or mismatched paid orders.
- Priority: P0

### 5. Realtime/Socket.IO architecture is not implemented

- Category: Realtime
- Severity: HIGH
- Files: `backend/src/config/socket.ts`, `backend/src/server.ts`, `user-app/hooks/useTracking.ts`, `user-app/lib/orderApi.ts`, package manifests
- Current behavior: Socket.IO is installed and has config, but no `new Server(...)`, JWT socket auth, rooms, event names, or broadcasts are wired in backend server startup. User app uses Supabase realtime channels for orders/tracking.
- Broken behavior: target Socket.IO rules are unmet; dispatch/tracking/dashboard realtime is not centralized or authenticated through Socket.IO.
- Exact root cause: realtime was declared as a dependency/config but not integrated into server lifecycle.
- Violating layer: realtime communication layer and service event coordination.
- Architectural violation: realtime side effects are not coordinated by services.
- Current flow: UI hook -> Supabase `.channel(...).on('postgres_changes')` -> database WAL feed.
- Target flow: UI socket client -> authenticated socket gateway -> service-broadcasted events -> rooms.
- Recommended fix sequence: create socket server attached to HTTP server; JWT-authenticate customer/driver/admin sockets; define rooms (`order:{id}`, `driver:{id}`, `admin:orders`); emit only after service mutations; add cleanup/reconnect tests.
- Migration risk: Medium.
- Deployment risk: High for live operations.
- Rollback risk: Medium; Supabase realtime can remain read-only fallback during migration.
- Production impact: live tracking/admin updates are unreliable and not under backend control.
- Priority: P1

### 6. Driver finance still uses revenue share despite salary-based target

- Category: Finance / product model
- Severity: HIGH
- Files: `backend/src/services/checkout.service.ts`, `backend/src/services/driver.service.ts`, `backend/src/repositories/checkout.repository.ts`, `scripts/admin-api.js`, `admin/src/pages/settings.tsx`
- Current behavior: driver earnings and COD are calculated using `driver_share_pct` and `driver_tip_share_pct`; settings include `default_commission_percent` and driver share descriptions.
- Broken behavior: target architecture says drivers are salary-based employees and revenue percentage/payout systems must be removed or deprecated.
- Exact root cause: old gig-driver finance model still powers delivery completion and payout flows.
- Violating layer: Service and legacy monolith route layer.
- Architectural violation: outdated business model duplicated across legacy and new services.
- Recommended fix sequence: remove driver earnings percentage accrual from delivery completion; keep COD liability only if operationally needed; mark payout request UI disabled or salary-only; migrate settings; archive historical earning fields.
- Migration risk: High because finance reports and driver screens depend on these fields.
- Deployment risk: High if payroll/accounting relies on current data.
- Rollback risk: Medium with DB backup and feature flag.
- Production impact: drivers may see incorrect earnings and finance may settle the wrong amounts.
- Priority: P1

## Required Flow Verdicts

| Flow | Status | Evidence |
|---|---|---|
| User checkout | PARTIALLY WORKING | Store orders go through `user-app/lib/orderApi.ts` -> `/admin-api/v1/checkout` -> checkout service/RPC, but UI still computes totals and Stripe amount; custom orders write directly to Supabase. |
| Admin order visibility | PARTIALLY WORKING | Admin API lists orders from legacy `scripts/admin-api.js`; no proven instant Socket.IO update. |
| Driver dispatch | BROKEN / PARTIAL | Drivers fetch available orders; no centralized dispatch queue/offers found. |
| Driver acceptance | PARTIALLY WORKING | Driver API calls `/v1/orders/:id/accept` or `/driver/orders/:id/claim`; duplicated paths and status semantics. |
| Status update | PARTIALLY WORKING | Backend has protected transitions, but duplicate implementations exist in legacy and new backend. |
| Notification flow | PARTIALLY WORKING | Backend push helpers exist, but push token writes come from frontend direct Supabase update. |
| Cancellation | PARTIALLY WORKING | Store order cancellation goes to backend; old direct update helper existed in `user-app/lib/api.ts` and legacy paths remain. |
| Delivery completion | PARTIALLY WORKING / RISKY | Completion updates order and driver finance, but finance model violates salary target. |
| Driver realtime location | BROKEN / PARTIAL | Redis heartbeat exists only on profile PATCH with coordinates; no background tracking trace or Socket.IO room flow. |
| Admin finance / COD | RISKY | Legacy monolith mutates driver earnings/COD/payouts directly with service-role Supabase. |
| Authentication | PARTIALLY WORKING | JWT kinds exist, but legacy fallback admin account and duplicated auth remain. |
| JWT / role enforcement | PARTIALLY WORKING | Admin roles exist in legacy; new backend compile failure prevents trust. |
| Stripe / payment | RISKY / INSECURE | Session amount is client-provided; no webhook evidence in inspected paths. |
| RLS / database protection | PARTIALLY WORKING | `015_secure_checkout.sql` tightens order/wallet RLS, but frontend direct write code and legacy service-role routes remain. |

## Final Summary

### 1. What already works

- Some server-authoritative store checkout logic exists in `backend/src/services/checkout.service.ts` and `supabase/migrations/015_secure_checkout.sql`.
- Admin role concepts exist in `scripts/admin-api.js` and admin UI routing.
- Driver login/profile/order endpoints exist in both legacy and new backend.
- Redis GEO/heartbeat code exists in `backend/src/services/driver.service.ts`.
- Push notification helpers exist in `backend/src/notifications/notifications.ts`.

### 2. What is partially working

- Store checkout, cancellation, driver acceptance, order status updates, admin order management, wallet/refund/COD surfaces, and Supabase realtime subscriptions.

### 3. What is broken

- New backend build.
- Strict MVC deployment.
- Socket.IO realtime system.
- Single source of API truth.
- Public payment integrity.

### 4. What is fake or mocked

- Legacy admin fallback account `admin@jaheez.ma` / `admin123`.
- Demo/login strings and demo order/chat guard paths.
- Fake place ratings and mock fallback data in `user-app/lib/placesApi.ts`.
- Prototype-only folders: `html-preview`, `jaheez-temp`, `jaheez_workspace`, `artifacts/mockup-sandbox`.

### 5. What is insecure

- Direct frontend Supabase writes.
- Client-influenced Stripe amount.
- Legacy service-role monolith with broad data mutation surface.
- OTP in process memory.
- Missing Socket.IO auth because Socket.IO server is not wired.

### 6. What is missing

- Single production API base.
- Backend endpoints for all frontend writes.
- Authenticated Socket.IO gateway.
- Webhook-first payment confirmation.
- Production CI build/typecheck.
- Salary-based driver finance model.

### 7. What must be fixed before launch

- Make backend compile.
- Remove direct frontend writes for secure/business entities.
- Make payment amount server-authoritative.
- Choose one backend and one API namespace.
- Remove mock admin fallback.
- Replace revenue-share driver finance.

### 8. What can wait until later

- Full visual polish, advanced analytics, non-critical content CMS, and prototype asset cleanup after production paths are isolated.

### 9. Single biggest architectural danger

Split authority between legacy monolith, new MVC backend, frontend Supabase clients, and Supabase RPC.

### 10. Single biggest product danger

Operations can believe orders/dispatch/tracking are live while drivers are only fetching available orders and realtime is not centralized.

### 11. Single biggest security danger

Client and legacy endpoints can influence business-critical data outside the target service layer.

### 12. Single biggest realtime danger

Socket.IO is declared but not implemented; live behavior depends on direct Supabase subscriptions and ad hoc refreshes.

### 13. Single biggest UX danger

The app shows production-like checkout/tracking/payment surfaces even when underlying flows are partial or divergent.

## Production Questions

- Can the app safely launch internally? Only for controlled engineering testing with seeded data and cash-only mode. Not as an operational pilot.
- Can the app safely launch publicly? No.
- What would break under real traffic? New backend deployment, live dispatch expectations, payment reconciliation, Redis online accuracy, and duplicated legacy/new route behavior.
- What could be exploited? Client-influenced payment amount, direct Supabase writes if RLS/policies drift, legacy fallback credentials, and broad service-role endpoints.
- What is fake? Demo paths, mock/fallback data, Socket.IO claims, prototype directories, and some analytics/realtime expectations.
- What is dangerously unfinished? Payment, strict backend authority, Socket.IO, backend build, driver salary finance migration.
- What must be removed immediately? Built-in mock admin fallback, frontend writes to orders/custom orders, revenue-share settings for salary drivers, unused prototype deployment paths.
- What is production-ready? Very little. Some DB hardening migration concepts and server checkout calculations are a useful foundation.
- What should be rewritten entirely? The legacy monolith should be retired behind a real MVC backend, not incrementally trusted as production architecture.
