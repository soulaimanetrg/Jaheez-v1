# JAHEEZ Current-State Execution Audit

Generated: 2026-06-10  
Scope: live repository state in `Jaheez-v1` after the current Phase 1 hardening work. This audit intentionally uses command output and source inspection rather than stale README or historical gap-analysis claims.

## Executive Status

| Area | Status | Finding |
| --- | --- | --- |
| Backend build | WORKING | `npm.cmd run build --prefix backend` passes. |
| Expo app entrypoints | WORKING | `user-app` and `driver-app` both use `expo-router/entry`; `app/_layout.tsx` and `app/index.tsx` exist. |
| Direct frontend DB writes | WORKING | Static scan found only local in-memory `.delete()` false positives, not Supabase mutations. |
| Legacy admin API | SECURITY VIOLATION / DESYNC RISK / PRODUCTION BLOCKER | `scripts/admin-api.js` still contains fallback JWT secret, mock admin credential fallback, service-role authority, OTP memory stores, Stripe amount authority, and mutation routes. |
| Stripe session creation | SECURITY VIOLATION / DESYNC RISK / PRODUCTION BLOCKER | Legacy Stripe session creation still accepts `amount_centimes` from the user app. |
| Checkout display totals | DESYNC RISK | Frontend still calculates display totals and promo presentation. Backend checkout must remain the only official authority. |
| Order lifecycle | DESYNC RISK / ARCHITECTURE VIOLATION | Lifecycle rules are split across checkout, driver, and legacy admin paths. |
| Socket.IO and heartbeat | PARTIALLY WORKING | Backend implementation exists, but runtime behavior has not been smoke-tested with real clients/Redis. |
| Salary model transition | PARTIALLY WORKING / DESYNC RISK | New backend settlement is salary-model aligned, but legacy/admin/driver screens still reference earnings and commission concepts. |
| Mock/fallback data | RISKY / INSECURE | Fallback/mock store discovery paths remain in the user app and legacy scripts. |

## Commands Run

```powershell
npm.cmd run build --prefix backend
```

Result: WORKING. TypeScript build completes.

```powershell
rg "supabase\.from\([^\n]+\)\.(insert|update|delete|upsert)|\.insert\(|\.update\(|\.delete\(" user-app driver-app admin -g "*.ts" -g "*.tsx"
```

Result: WORKING for direct DB write removal. Remaining matches are false positives:

| File | Match | Classification |
| --- | --- | --- |
| `admin/src/hooks/use-toast.ts` | `toastTimeouts.delete(toastId)` | False positive: local `Map.delete`, not Supabase. |
| `user-app/app/(flows)/category/[id].tsx` | `Set.delete(sid)` | False positive: local UI favorite set update, not Supabase. |

Additional audit commands used or required for repeat verification:

```powershell
rg "amount_centimes|payment_status|stripe|total_amount|delivery_fee|promo|discount" user-app backend scripts admin -g "*.ts" -g "*.tsx" -g "*.js"
rg "SUPABASE_SERVICE_ROLE_KEY|service_role|JWT_SECRET \|\||admin123|otpStore|mock|demo|bypass|fallback" backend scripts user-app driver-app admin -g "*.ts" -g "*.tsx" -g "*.js"
rg "driver_share_pct|driver_tip_share_pct|commission|earnings_centimes|cod_balance_centimes" backend scripts admin driver-app -g "*.ts" -g "*.tsx" -g "*.js"
rg "socket|join_room|redis|heartbeat|is_online|current_lat|current_lng" backend scripts driver-app admin user-app -g "*.ts" -g "*.tsx" -g "*.js"
```

## 1. Project Structure Summary

| Path | Status | Notes |
| --- | --- | --- |
| `backend/` | ACTIVE / PARTIALLY WORKING | Target production authority. Build passes. MVC slices, realtime server, Redis heartbeat worker, checkout, driver, and customer endpoints are present. Runtime smoke testing is still required. |
| `user-app/` | ACTIVE / PARTIALLY WORKING | Expo Router app with migrated customer mutations. Direct Supabase write scan is clean, but checkout/payment display authority and fallback discovery data remain risks. |
| `driver-app/` | ACTIVE / PARTIALLY WORKING | Expo Router app. Needs lifecycle and salary-model terminology cleanup, plus device/runtime validation. |
| `admin/` | ACTIVE / PARTIALLY WORKING | Vite React admin. Still references finance/earnings concepts and must be aligned to salary model and backend-only authority. |
| `shared/` | ACTIVE / RISKY | Shared artifacts exist. `shared/types.js` is untracked and must remain untouched during this audit step. |
| `supabase_migrations/` | ACTIVE / PARTIALLY WORKING | Contains migration artifacts, including soft-delete work. Needs migration completeness check against `supabase_schema.sql`. |
| `docs/` | ACTIVE | Contains audits and planning artifacts. Some older docs are stale after the latest hardening changes. |
| `scripts/admin-api.js` | LEGACY / SECURITY VIOLATION / DESYNC RISK / PRODUCTION BLOCKER | Legacy mutation authority still exists and overlaps backend authority. |
| `scripts/proxy.js` | LEGACY / RISKY | Legacy proxy path references mockup behavior. Must remain out of production execution. |
| `html-preview/` | PROTOTYPE / DEAD / UNUSED candidate | Candidate for archive/removal after confirmation. |
| `jaheez-temp/` | PROTOTYPE / DEAD / UNUSED candidate | Candidate for archive/removal after confirmation. |
| `jaheez_workspace/` | PROTOTYPE / DEAD / UNUSED candidate | Candidate for archive/removal after confirmation. |
| mock/fallback data | RISKY / INSECURE | Store and discovery fallback paths remain in the user app and must be isolated from production runtime. |

## 2. Backend Architecture Summary

Target architecture:

```text
Frontend/UI
-> Communication Layer
-> Controller Layer
-> Service Layer
-> Repository/Data Layer
-> Database
```

Current backend status is PARTIALLY WORKING.

Working architecture:

| Layer | Evidence |
| --- | --- |
| Routes | `backend/src/routes/*.routes.ts` exists for auth, checkout, driver, and customer flows. |
| Controllers | `backend/src/controllers/*.controller.ts` exists. Customer MVC endpoints have been added. |
| Services | `backend/src/services/*.service.ts` owns most checkout, customer, driver, realtime, and auth business rules. |
| Repositories | `backend/src/repositories/*.repository.ts` owns most Supabase persistence. |
| Realtime | `backend/src/realtime/socket.server.ts` attaches Socket.IO to the backend HTTP server. |
| Heartbeat | `backend/src/workers/driverHeartbeat.worker.ts` handles stale driver cleanup through service/repository paths. |

Remaining layer concerns:

| Finding | Tag | Risk |
| --- | --- | --- |
| `backend/src/app.ts` mounts `apiLimiter` after routers. | RISKY / INSECURE | Rate limiting may not cover previously mounted API routes. Move limiter before route registration unless intentionally scoped. |
| Middleware still performs some Supabase access for auth/admin/audit support. | ARCHITECTURE VIOLATION candidate | Auth infrastructure can be acceptable when isolated, but DB writes such as audit logging should be reviewed and moved behind service/repository boundaries where practical. |
| `SUPABASE_SERVICE_ROLE_KEY` is present in backend infrastructure/config. | PARTIALLY WORKING | Allowed only in repositories or isolated infrastructure. Confirm no route/controller/socket utility owns service-role authority. |
| Legacy `scripts/admin-api.js` remains mutation-capable. | SECURITY VIOLATION / DESYNC RISK | It bypasses the new backend layering and can mutate orders, finance, OTP, and payment flows. |

## 3. Frontend Architecture Summary

### User App

Status: PARTIALLY WORKING.

| Area | Status | Notes |
| --- | --- | --- |
| Expo Router | WORKING | `main` is `expo-router/entry`; `app/_layout.tsx` and `app/index.tsx` exist. |
| Mutation communication | WORKING for direct DB writes | Direct Supabase mutation scan is effectively clean. Customer writes now go through backend helper/API paths. |
| Supabase reads/realtime | ALLOWED | Authenticated reads and read-only realtime subscriptions may remain. |
| Checkout display | DESYNC RISK | Cart and checkout still calculate display totals/promo previews. Backend must ignore or reject client totals. |
| Stripe session creation | SECURITY VIOLATION | User app still sends `amount_centimes` to legacy Stripe session endpoint. |
| Fallback discovery data | RISKY / INSECURE | Store/discovery fallback paths and mock data must be isolated from production runtime. |
| AI suggestion route | RISKY / DEAD / UNUSED candidate | `user-app/app/(flows)/ai-suggestion.tsx` still exists despite prior product direction implying AI removal. Decide whether to remove, hide, or explicitly support. |

### Driver App

Status: PARTIALLY WORKING.

| Area | Status | Notes |
| --- | --- | --- |
| Expo Router | WORKING | `main` is `expo-router/entry`; `app/_layout.tsx` and `app/index.tsx` exist. |
| Lifecycle authority | DESYNC RISK | Driver UI and driver backend paths must not decide lifecycle transitions independently of the final `OrderService`. |
| Salary model | DESYNC RISK | Screens still reference earnings/revenue concepts. Align labels and calculations to fixed salary plus COD reconciliation/debt tracking only. |
| Heartbeat/location | PARTIALLY WORKING | Backend heartbeat is implemented; app-to-backend runtime flow still needs smoke testing. |

### Admin

Status: PARTIALLY WORKING.

| Area | Status | Notes |
| --- | --- | --- |
| Runtime | PARTIALLY WORKING | Vite React admin exists. Build/runtime not checked in this audit step. |
| Authority | DESYNC RISK | Must use backend admin endpoints only, not legacy mutation routes. |
| Finance terminology | DESYNC RISK | Earnings, payout, and commission concepts need salary-model migration. |

## 4. Database and RLS Summary

Status: PARTIALLY WORKING.

| Artifact | Status | Notes |
| --- | --- | --- |
| `supabase_schema.sql` | PARTIALLY WORKING / RISKY | Contains RLS policies, wallet policies, chat policies, and helper RPCs. It must be reconciled with actual deployed migrations. |
| `supabase_migrations/012_user_soft_delete.sql` | WORKING candidate | Soft-delete migration exists. |
| Order RLS | RISKY / INSECURE | Schema includes authenticated order insert/update policies. Even if frontend writes are removed, RLS should be tightened so production mutations cannot bypass backend authority. |
| Chat RLS | RISKY / INSECURE | Direct chat insert policy remains available at DB level. Backend API is now used, but RLS should match backend-authoritative design. |
| Wallet RLS | PARTIALLY WORKING | Schema appears to tighten wallet access to read-only after earlier broad policies, but deployed order must be verified. |
| Checkout/RLS migration coverage | PARTIALLY WORKING | Secure checkout/RLS hardening needs a dedicated migration review and deployment proof. |

Required follow-up:

- Confirm every policy deployed to Supabase matches backend-authoritative production design.
- Remove or narrow direct client insert/update/delete policies for orders, chat, wallets, and payment-adjacent tables.
- Keep service-role writes inside repositories/infrastructure only.

## 5. Legacy Backend Risk Summary

`scripts/admin-api.js` is the highest-risk artifact in the repo.

| Finding | Tag | Current Behavior | Required Fix |
| --- | --- | --- | --- |
| Fallback JWT secret | SECURITY VIOLATION / PRODUCTION BLOCKER | Uses a hardcoded fallback if env is missing. | Remove fallback; fail startup without a strong env secret. |
| Mock admin credential `admin123` | SECURITY VIOLATION / PRODUCTION BLOCKER | Allows fallback login behavior. | Remove from runtime path; isolate dev-only fixtures outside production. |
| Service-role client | SECURITY VIOLATION / DESYNC RISK | Legacy script can mutate production data outside new backend boundaries. | Lock legacy API to read-only/internal-only, then retire it. |
| In-memory OTP stores | SECURITY VIOLATION | OTP state can diverge and is not durable/auditable. | Move OTP to one backend-owned durable or provider-backed flow, or keep dormant. |
| Mutation routes | DESYNC RISK / PRODUCTION BLOCKER | Orders, wallets, payouts, statuses, and finance can be mutated by legacy paths. | Disable public mutation routes after backend endpoint parity. |
| Stripe amount authority | SECURITY VIOLATION / PRODUCTION BLOCKER | Accepts `amount_centimes` from client. | Create backend-owned Stripe session endpoint that calculates amount server-side. |
| Revenue-share finance | DESYNC RISK | Still calculates driver cut/commission-like behavior. | Remove from authoritative calculations; keep COD reconciliation only. |

`scripts/proxy.js` is LEGACY / RISKY and should not be part of production execution.

## 6. Direct Supabase Write Audit

Status: WORKING.

The direct frontend mutation scan across `user-app`, `driver-app`, and `admin` found no remaining Supabase `.insert`, `.update`, `.delete`, or `.upsert` production writes.

False positives:

| File | Current Behavior | Violation Type |
| --- | --- | --- |
| `admin/src/hooks/use-toast.ts` | Deletes a toast timeout from a local `Map`. | None. |
| `user-app/app/(flows)/category/[id].tsx` | Deletes an id from a local `Set` for UI state. | None. |

Required guardrail:

- Keep this scan in validation before each release.
- Treat any future `supabase.from(...).insert/update/delete/upsert` in frontend code as SECURITY VIOLATION unless explicitly approved as a read-only exception is impossible by definition.

## 7. Checkout Authority Audit

Status: PARTIALLY WORKING / DESYNC RISK.

Working:

- Backend `CheckoutService` recalculates subtotal, delivery fee, discount, tip, total, and order/payment amounts for normal checkout.
- Recent frontend direct writes were removed.
- Production demo coupon authority was removed from cart execution.

Risks:

| Finding | Tag | Risk |
| --- | --- | --- |
| Frontend cart/checkout still displays calculated totals and promo preview values. | DESYNC RISK | Acceptable for display only, but must never be accepted as official payment/order authority. |
| Legacy checkout/payment routes still accept client amounts. | SECURITY VIOLATION | Client can tamper with payment amount if legacy route is reachable. |
| Custom order service uses simplistic delivery/total defaults. | DESYNC RISK | Needs a real backend pricing model or explicit manual-review status. |
| Checkout logic overlaps lifecycle behavior. | DESYNC RISK | Lifecycle transitions must move to one `OrderService`. |

Required fix:

- Add or expose a backend-authoritative Stripe/payment-session endpoint that accepts identifiers and intent only.
- Reject or ignore all client totals, subtotal, discounts, delivery fee, promo discount, and Stripe amount.
- Keep idempotency keys and ownership validation in the backend.

## 8. Payment Authority Audit

Status: SECURITY VIOLATION / PRODUCTION BLOCKER.

| Source | Current Behavior | Risk |
| --- | --- | --- |
| `user-app/lib/stripeClient.ts` | Sends `amount_centimes` from frontend to checkout-session endpoint. | Client-controlled amount. |
| `user-app/app/(flows)/checkout.tsx` | Calculates `finalTotal` and passes it into Stripe session creation. | Payment tampering risk. |
| `scripts/admin-api.js` | Creates Stripe sessions using client-provided amount. | Direct payment authority bypass. |
| `backend/src/services/checkout.service.ts` | Calculates backend totals for checkout. | Correct authority path for order totals, but Stripe session flow must be aligned. |

Required fix:

1. Implement a backend production Stripe session endpoint under the new backend.
2. Require JWT, role, ownership, and idempotency key.
3. Recalculate amount from order/cart data inside service logic.
4. Reject requests containing authoritative amount fields or log them as tamper attempts.
5. Retire or lock down legacy Stripe session creation.

## 9. Order Lifecycle Audit

Status: DESYNC RISK / ARCHITECTURE VIOLATION.

Allowed lifecycle:

```text
pending
-> confirmed
-> assigned
-> arrived_pickup
-> picked_up
-> arrived_customer
-> delivered
-> completed
```

Allowed cancellation:

| Actor | Rule |
| --- | --- |
| Customer | Can cancel only `pending` or `confirmed`. |
| Driver | Cannot directly cancel. |
| Admin | Override allowed only with audit logging. |

Current duplicate authority paths:

| Source | Status | Risk |
| --- | --- | --- |
| `backend/src/services/checkout.service.ts` | Active lifecycle behavior exists. | DESYNC RISK if retained outside `OrderService`. |
| `backend/src/services/driver.service.ts` | Driver claim/stage/delivered behavior exists. | DESYNC RISK if it decides transitions independently. |
| `scripts/admin-api.js` | Legacy order/status mutation routes exist. | CRITICAL DESYNC RISK. |
| Frontend helpers/screens | Mostly communication/display now. | Must remain non-authoritative. |

Required fix:

- Introduce or finalize `OrderService` as the only lifecycle transition authority.
- Make checkout, driver, admin, and socket-triggered actions call `OrderService`.
- Keep repositories persistence-only.
- Add audit logging for admin overrides.
- Disable legacy lifecycle mutation routes.

## 10. Driver Heartbeat and Realtime Audit

Status: PARTIALLY WORKING.

Working implementation:

- `backend/src/services/driver.service.ts` records heartbeat/location activity.
- Redis key/index is used as temporary heartbeat memory.
- `backend/src/workers/driverHeartbeat.worker.ts` scans every 30 seconds.
- Stale drivers are marked offline in the database and coordinates are cleared.
- Dashboard/driver rooms are notified by realtime emissions.

Risk:

| Finding | Tag | Risk |
| --- | --- | --- |
| Runtime behavior not smoke-tested. | PARTIALLY WORKING | Need live Redis, backend server, and client/socket tests. |
| Driver app end-to-end heartbeat path not verified. | PARTIALLY WORKING | Device/app runtime may fail even if backend compiles. |
| Redis dependency behavior under outage not tested. | RISKY | Need graceful degradation and structured logging. |

Required validation:

- Online driver heartbeat refreshes Redis TTL.
- Stale driver becomes offline after missed TTL.
- `current_lat` and `current_lng` clear in DB.
- Admin dashboard update emits.
- Redis is never treated as permanent truth.

## 11. Socket.IO Auth Audit

Status: PARTIALLY WORKING.

Working implementation:

- Socket.IO attaches to the backend HTTP server.
- Connect-time JWT validation is implemented.
- `join_room` authorization is implemented for:
  - `order:<id>`
  - `driver:<id>`
  - `admin:dashboard`
- Realtime service validates room access.

Remaining risks:

| Finding | Tag | Risk |
| --- | --- | --- |
| Runtime socket auth not smoke-tested. | PARTIALLY WORKING | Need unauthenticated and unauthorized client tests. |
| Per-event validation must stay strict. | SECURITY VIOLATION if missing | Every future event must validate token, role, and ownership. |
| Socket-triggered mutations must route through services. | CRITICAL ARCHITECTURE VIOLATION if bypassed | Socket handlers must never call repositories directly for critical state. |

Required validation:

- Unauthenticated clients are rejected.
- Customers cannot join unrelated order rooms.
- Drivers cannot join unrelated driver rooms.
- Non-admin users cannot join `admin:dashboard`.
- Any future socket mutation action flows through controller/service/repository boundaries or an equivalent service-owned command path.

## 12. Redis Usage Audit

Status: PARTIALLY WORKING.

Approved role:

- Temporary realtime/cache/heartbeat memory.
- TTL-backed online presence.
- Dashboard notification support.

Forbidden role:

- Permanent source of truth.
- Wallet/order/payment authority.
- Lifecycle decision authority.

Current state:

| Usage | Status | Notes |
| --- | --- | --- |
| Driver heartbeat TTL | WORKING candidate | TTL is 30 seconds and worker interval is 30 seconds. |
| Stale driver persistence | WORKING candidate | Worker writes offline state and clears coordinates in DB through backend data layer. |
| Permanent truth usage | No confirmed violation in new backend | Continue scanning as realtime code grows. |

Required follow-up:

- Smoke-test Redis unavailable/degraded behavior.
- Ensure dashboard can recover from DB truth after Redis loss.

## 13. Expo App Startup Audit

Status: WORKING for configuration shape; runtime startup not executed in this audit step.

Evidence:

| App | Evidence | Status |
| --- | --- | --- |
| `user-app` | `package.json` has `"main": "expo-router/entry"`; `app/_layout.tsx` and `app/index.tsx` exist. | WORKING candidate |
| `driver-app` | `package.json` has `"main": "expo-router/entry"`; `app/_layout.tsx` and `app/index.tsx` exist. | WORKING candidate |

Likely causes of the old `../../App` error:

- Starting Expo from the wrong folder.
- Stale Metro cache.
- Old native/Expo state from before Expo Router migration.
- A stale dependency or generated cache expecting an `App` file.

Correct run commands:

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\user-app
npm.cmd install
npm.cmd run start -- --clear
```

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\driver-app
npm.cmd install
npm.cmd run start -- --clear
```

Do not start from the repo root unless a root workspace script is added.

Configuration risk:

- `user-app/metro.config.js` contains custom resolver logic and monorepo watch settings. This may be necessary, but it should be tested on Windows and device builds.

## 14. UI Flow Audit

Desired flow:

```text
splash -> auth -> home -> services -> search -> store -> product detail -> cart -> checkout -> tracking -> profile
```

Current state:

| Flow Area | Status | Notes |
| --- | --- | --- |
| Splash/onboarding/auth | PARTIALLY WORKING | Routes exist. Runtime not tested in this audit. |
| Home/search/services/store/category | PARTIALLY WORKING | Routes and data layers exist, but fallback/mock discovery paths remain. |
| Product detail/cart/checkout | PARTIALLY WORKING / DESYNC RISK | UI flow exists. Payment authority must be moved fully to backend. |
| Tracking/orders/chat | PARTIALLY WORKING | Chat mutation now uses backend; tracking/realtime requires runtime validation. |
| Profile/settings/support | PARTIALLY WORKING | Customer support/profile endpoints exist. UX cleanup is later than safety work. |
| AI suggestion | RISKY / DEAD / UNUSED candidate | Existing route conflicts with prior removal direction. Decide product policy before launch. |
| Wallet | PARTIALLY WORKING / DESYNC RISK | Must represent operational COD/debt only, not driver revenue-share authority. |

UI reorganization should wait until authority, payment, lifecycle, and legacy risks are fixed.

## 15. Production Blockers

| Priority | Blocker | Tags | Required Outcome |
| --- | --- | --- | --- |
| P0 | Legacy `scripts/admin-api.js` remains mutation-capable. | SECURITY VIOLATION / DESYNC RISK / PRODUCTION BLOCKER | Lock to read-only/internal-only or remove from production path. |
| P0 | Stripe session accepts frontend `amount_centimes`. | SECURITY VIOLATION / PRODUCTION BLOCKER | Backend-owned Stripe amount calculation only. |
| P0 | Fallback JWT secret and `admin123` fallback remain in legacy script. | SECURITY VIOLATION / PRODUCTION BLOCKER | Remove fallback secrets/default credentials. |
| P0 | Order lifecycle authority split across services and legacy API. | DESYNC RISK / ARCHITECTURE VIOLATION | Centralize in `OrderService`. |
| P1 | RLS still permits direct client-side writes for sensitive tables. | RISKY / INSECURE | Tighten policies to backend-authoritative design. |
| P1 | Socket.IO/heartbeat not runtime tested. | PARTIALLY WORKING | Add smoke tests and validation evidence. |
| P1 | Salary model references remain in legacy/admin/driver surfaces. | DESYNC RISK | Remove revenue-share authority; keep COD reconciliation only. |
| P1 | Mock/fallback store data remains in runtime paths. | RISKY / INSECURE | Isolate dev fixtures outside production execution. |
| P2 | API limiter mounted after routers. | RISKY / INSECURE | Move limiter before protected route registration or document intended scope. |
| P2 | Expo startup not runtime verified after hardening. | PARTIALLY WORKING | Run app startup from correct folders with cache clear. |

## 16. Exact Ordered Fix Plan

### Phase 0: Runnable Checks

1. Run backend build:

   ```powershell
   npm.cmd run build --prefix backend
   ```

2. Run direct frontend mutation scan:

   ```powershell
   rg "supabase\.from\([^\n]+\)\.(insert|update|delete|upsert)|\.insert\(|\.update\(|\.delete\(" user-app driver-app admin -g "*.ts" -g "*.tsx"
   ```

3. Start backend locally with required env vars.
4. Start `user-app` from `user-app/` using Expo clear cache.
5. Start `driver-app` from `driver-app/` using Expo clear cache.
6. Do not modify UI structure until safety blockers below are addressed.

### Phase 1: Legacy Authority Lockdown

1. Remove hardcoded fallback JWT secret from `scripts/admin-api.js`.
2. Remove `admin123` mock admin fallback from runtime execution.
3. Disable or internal-gate legacy mutation routes for orders, wallets, payouts, OTP, and statuses.
4. Keep only read-only legacy routes if they are still needed temporarily.
5. Add loud startup failure if production tries to run legacy API without explicit internal-only configuration.

### Phase 2: Stripe and Checkout Authority

1. Add backend Stripe session endpoint under the new backend.
2. Require `verifySupabaseJwt`, role, ownership, and idempotency validation.
3. Accept identifiers and intent only.
4. Recalculate subtotal, delivery fee, promo, discount, tip, total, and Stripe amount inside backend service logic.
5. Reject or ignore client amount fields and log tamper attempts.
6. Update user app Stripe client to stop sending `amount_centimes`.
7. Retire legacy Stripe session creation.

### Phase 3: Order Lifecycle Centralization

1. Introduce or finalize `OrderService`.
2. Move transitions from `CheckoutService` and `DriverService` into `OrderService`.
3. Route checkout, driver, admin, and socket-triggered lifecycle actions through `OrderService`.
4. Enforce allowed lifecycle path:

   ```text
   pending -> confirmed -> assigned -> arrived_pickup -> picked_up -> arrived_customer -> delivered -> completed
   ```

5. Enforce customer cancellation only for `pending` and `confirmed`.
6. Enforce admin override only with audit logging.
7. Remove or disable legacy lifecycle mutation paths.

### Phase 4: Realtime and Heartbeat Runtime Testing

1. Run backend with Redis configured.
2. Verify unauthenticated socket connection rejection.
3. Verify unauthorized room join rejection.
4. Verify allowed rooms:
   - `order:<id>`
   - `driver:<id>`
   - `admin:dashboard`
5. Verify driver heartbeat writes TTL.
6. Verify stale driver worker marks DB offline and clears coordinates.
7. Verify dashboard update emission.

### Phase 5: RLS and Database Hardening

1. Reconcile `supabase_schema.sql` with deployed migrations.
2. Add migrations that remove direct client write authority for sensitive tables.
3. Ensure orders, chat, wallets, wallet transactions, payments, and lifecycle tables require backend authority for mutations.
4. Keep read policies only where mobile/admin clients genuinely need direct read access.
5. Document policy intent in migration comments.

### Phase 6: UI Reorganization

1. Remove production fallback/mock discovery data.
2. Decide whether `ai-suggestion` is removed, hidden, or officially supported.
3. Align wallet screens with COD reconciliation/debt tracking only.
4. Remove revenue-share wording from driver/admin surfaces.
5. Improve flow only after authority blockers are closed:
   - splash
   - auth
   - home
   - services
   - search
   - store
   - product detail
   - cart
   - checkout
   - tracking
   - profile

### Phase 7: Admin, Product Customization, Device Testing, Launch Prep

1. Confirm admin product/menu customization uses backend endpoints only.
2. Confirm product options/customization are priced by backend only.
3. Run backend build and frontend builds.
4. Run Expo startup on physical/emulated devices.
5. Test customer, driver, admin, finance, and super_admin role boundaries.
6. Test tampered checkout and repeated idempotency keys.
7. Produce launch validation report after runtime tests pass.

## Final Audit Position

JAHEEZ is no longer blocked by a backend TypeScript build failure, and the direct frontend Supabase mutation cleanup is effectively complete. The next release-critical work is not UI polish. It is authority consolidation:

1. Lock down or retire legacy `scripts/admin-api.js`.
2. Remove client-controlled Stripe amount authority.
3. Centralize order lifecycle in one backend service.
4. Tighten RLS to match backend-authoritative production design.
5. Smoke-test Socket.IO, Redis heartbeat, and Expo startup paths.

Until those are complete, the system remains PARTIALLY WORKING with multiple SECURITY VIOLATION, DESYNC RISK, and PRODUCTION BLOCKER findings.
