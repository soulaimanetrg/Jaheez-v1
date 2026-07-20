# Jaheez Hardening — Change Report & Remaining Work

**Date:** 2026-07-18
**Origin:** full four-dimension code review (security / logic / features / creativity), followed by the approved "Jaheez Hardening & Launch Plan".
**Verification state:** backend `tsc` clean · **176/176** vitest tests green (166 baseline + 10 new contract tests) · user-app `tsc` clean · driver-app `tsc` clean.

---

## 1. Completed work, by plan phase

### Phase 1 — Critical security closures (COMPLETE)

**1.1 Confirmation-code bypass closed (HIGH).**
Removed the legacy `POST /v1/orders/:id/pickup` and `/deliver` routes and their controller/service methods. The only way a driver can advance an order is now `POST /driver/orders/:id/stage`, which validates the customer's 4-digit pickup/delivery codes before transitioning. Verified no frontend called the removed routes.
Files: `backend/src/features/order/driverOrder.routes.ts`, `checkout.controller.ts`, `checkout.service.ts`.

**1.2 Driver token revocation (HIGH).**
Driver JWTs live 30 days; previously a deactivated driver kept API and socket access until token expiry. Added `backend/src/utils/driverStatus.ts` (new file): checks `drivers.is_active` with a 60s Redis cache (`driver:active:{id}`), fails closed on lookup errors. Wired into:
- `backend/src/middleware/driver.middleware.ts` — every driver HTTP request
- `backend/src/features/realtime/realtime.service.ts` — socket handshake; the customer socket branch also gained the ban/existence check it was missing
- `backend/src/features/admin/admin.service.ts` — deactivation purges the cache for instant lockout

**1.3 Fail-closed customer ban check (MEDIUM).**
`backend/src/middleware/supabaseJwt.middleware.ts` previously let requests through when the ban lookup errored. Now rejects with `auth_verification_failed`, matching the bootstrap variant.

**1.4 Per-role JWT secrets (HIGH).**
`ADMIN_JWT_SECRET` was signing admin tokens, refresh tokens, driver tokens, AND hashing OTP phone numbers. Added optional `DRIVER_JWT_SECRET` and `OTP_HASH_SECRET` (min 32 chars, fallback to `ADMIN_JWT_SECRET` until provisioned) and raised the `ADMIN_JWT_SECRET` minimum to 32 chars (existing secrets are 64, so no boot break). Documented in `.env.example`.
Files: `backend/src/config/env.ts`, `backend/src/utils/jwt.ts`, `backend/src/features/auth/whatsappOtpHooks.ts`, `.env.example`.
**Deploy note:** setting `DRIVER_JWT_SECRET` invalidates outstanding driver tokens — drivers re-login once.

**1.5 Proxy + rate-limit store (MEDIUM).**
- trust proxy now set in production as well as staging (backend/src/app.ts) so req.ip is the real client behind the proxy.
- All five rate limiters share counters through Redis via a resilient store (backend/src/middleware/rateLimit.middleware.ts): Redis-backed while connected, per-process memory fallback when Redis is down, so Redis unavailability can never break requests.

### Phase 2 - Logic and money correctness (COMPLETE)

**2.1 Cancellation auto-ban reworked (HIGH product-impact).**
Was: 3 lifetime cancellations led to a silent permanent ban. Now: 3 cancellations in a rolling 7-day window set auth_risk_level=high for admin review. blocked/is_banned stay admin-only decisions.
Files: backend/src/features/order/checkout.service.ts, checkout.repository.ts (banUser/getCancelledOrdersCount replaced by flagUserForCancellationReview/getRecentCancelledOrdersCount).

**2.2 Stall reassignment race-guarded (HIGH).**
reassignOrderDueToStall previously used an unguarded UPDATE that could stomp a driver who had just picked up. Now uses a guarded write requiring driver_id to still match AND status in [confirmed, preparing] - a progressing order is never reset. Manual admin pull-back of a picked_up order remains an explicit opt-in.
Files: backend/src/features/order/orderLifecycle.service.ts, backend/src/features/admin/admin.service.ts.

**2.3 Commission finalization durability (MEDIUM).**
A delivered order whose inline commission recording failed was left stuck with no financial record and no retry. New outbox worker backend/src/workers/commissionRetry.worker.ts sweeps every 2 minutes for delivered/completed orders with financial_finalized_at NULL (2-min grace) and re-drives the idempotent finalize_delivered_order_financial RPC. Persistent failures (e.g. shift closed) are logged loudly for manual reconciliation. Wired into server.ts startup/shutdown.

**2.4 Atomic promo usage + claim offer check (MEDIUM). Migration 055.**
supabase_migrations/055_atomic_promo_and_claim_offer.sql:
- create_order_atomic gains p_promo_id: max-uses re-check under FOR UPDATE, uses_count increment and user_promo_usages insert now inside the order transaction (no promo oversell, no lost usage records).
- update_order_lifecycle claim branch validates offered_driver_id + offer_expires_at under the row lock and clears the offer in-transaction (closes the expiry/re-offer race).
- New record_driver_claim_metrics RPC: atomic acceptance-rate counters replacing racy read-modify-write JS.
- Service layer falls back to the legacy RPC signature if 055 is not yet applied, so backend and migration deploy in either order.
Registered in the checksum-tracked migration manifest (backend/scripts/migration-manifest.js).

### OTP provider freeze (user decision, 2026-07-18) (COMPLETE)

All provider OTP delivery (Wasender, Meta WhatsApp, Twilio Verify) is frozen behind one master switch: `OTP_DELIVERY_FROZEN` (default **true** - only an explicit `false` unfreezes). Providers are frozen, NOT deleted; re-enabling is a config change. Enforced at three independent layers:
1. `whatsappOtpHooks.ts` - Supabase send-SMS hook answers 503 before reading any secret.
2. `whatsappOtpSender.ts` - factory returns an inert `FrozenOtpSender` that throws instead of calling a provider.
3. `driverAuth.service.ts` - driver login skips the OTP second factor (CIN+password already verified) instead of locking drivers out; the Twilio client refuses outbound calls even if reached directly.

### De-hardcoding sweep (COMPLETE) - Migration 056

`supabase_migrations/056_zone_neighbors_and_service_fee.sql`:
- **Zone adjacency** moved from a compiled Arabic switch statement in `assignmentEngine.ts` to `delivery_zones.neighbor_zone_ids UUID[]`, seeded from the old Safi graph. Adding a city is now a data change. Adjacency treated as symmetric.
- **Checkout service fee** (was hardcoded `2` DH) now reads `app_settings.checkout_service_fee_centimes` with a bounded fail-safe fallback (0-50 DH clamp, never breaks checkout).
- **Fallback map coordinates** now come from `DEFAULT_MAP_LATITUDE/LONGITUDE` env instead of literal Safi coordinates.
- **Upload route** now requires `requireRole('super_admin', 'operations', 'content_manager')` instead of any admin.

### Frontend fixes (COMPLETE)

1. **Driver app - 403 revocation handling** (`driver-app/lib/api.ts`): a deactivated driver now gets logged out cleanly (`account_disabled` clears the token) instead of seeing a generic error forever.
2. **Driver app - real offer countdown** (`DriverDashboardScreen.tsx`): the accept modal now counts down from the backend's `offer_expires_at` (added to `DRIVER_ORDER_SELECT`) instead of a hardcoded 45s.
3. **Driver app - timeout is not a decline**: countdown expiry now just dismisses the offer locally; it no longer records an explicit rejection against the driver's acceptance rate (the backend timeout worker already tracks timeouts separately).
4. **User app - checkout idempotency key reuse** (`orderApi.ts`): one key per submission chain instead of per request, so a timeout-then-retap replays the same order instead of creating a duplicate. Key cleared on definitive responses, kept on ambiguous network failures.
5. **User app - localized error alerts** (`order/[id].tsx`): rating/cancellation/error-screen alerts were hardcoded Arabic; now follow the user's language (ar/fr).
6. **User app - fixed pre-existing compile error** (`orders.tsx`): reorder flow passed a client-side delivery fee to `setStore()` whose signature had dropped it; the user app did not typecheck before this fix.

### Test & tooling additions (NEW FILES)

- `backend/src/test/hardening.contract.test.ts` - 10 contract tests locking every invariant above in place (bypass routes stay gone, ban checks stay fail-closed, revocation stays wired, secrets stay split, cancellation stays windowed, reassignment stays guarded, commission retry stays wired, promo/claim stays atomic, OTP stays frozen at all three layers, zones/fees stay data-driven).
- `backend/scripts/smoke-happy-path.js` (`npm run smoke:happy-path`) - end-to-end staging smoke: register → bootstrap OTP → store browse → checkout → driver claim → pickup code → deliver code → rating. Refuses to run against production. **Blocked:** needs `.env` pointed at staging instead of production.
- `backend/src/test/driverAuth.service.test.ts` - driver login flow coverage (OTP freeze, CIN validation, token issuance).

---

## 2. What's NOT done yet (remaining work)

### Critical — local env safety ⚠️

**Problem:** `backend/.env` currently has `JAHEEZ_TARGET_ENV=production` and production Supabase credentials. Any `npm run dev` on this machine starts the commission-retry and reconciliation workers **against the live production database**. The smoke script refused to run for exactly this reason.

**Two options:**
1. **Staging split (recommended):** point `backend/.env` at your staging Supabase project (with production credentials only in the deployment environment).
2. **Hard guard:** keep prod in `.env` and add a boot-time check that refuses to start workers when `JAHEEZ_TARGET_ENV=production` && `NODE_ENV=development`.

**Decision needed before:** running the smoke script, resuming local dev, or deploying (deploy itself is safe, but post-deploy verification would use this local setup).

---

### Staging smoke run

`npm run smoke:happy-path` is written and syntax-checked but blocked on the env safety issue above. Once `.env` points at staging, one command exercises the full happy path end-to-end.

---

### Product features (from original plan Phase 3)

1. **Driver earnings transparency** — the shift summary endpoint exists (`GET /driver/payouts`), but the driver app's ProfileScreen doesn't yet show per-shift breakdowns or COD due. Low-effort UI win.
2. **COD dispute flow** — backend has `report_cod_discrepancy`, but unverified whether the driver app and admin panel wire it up end-to-end.
3. **Push notification fallback** — offer dispatch goes through socket; if the driver's socket is down, no fallback (SMS/push) exists. Socket reconnect is solid, but a backgrounded/killed app misses offers until reopened.

---

## 3. Summary table — what changed

| Area | Files modified | New files | Tests added |
|------|---------------|-----------|-------------|
| Auth & RBAC | 7 (middleware, JWT utils, driver/customer auth services) | `driverStatus.ts` | 3 contract tests |
| Order lifecycle | 5 (checkout service/repo/controller, driverOrder routes, orderLifecycle) | — | 4 contract tests |
| Financial correctness | 2 (commission repo, checkout service) | `commissionRetry.worker.ts` | 1 contract test |
| Config & de-hardcoding | 4 (app.ts, env.ts, assignmentEngine, upload routes) | — | 2 contract tests |
| Migrations | — | `055_atomic_promo_and_claim_offer.sql`, `056_zone_neighbors_and_service_fee.sql` | — |
| Frontend (driver-app) | 3 (api.ts, LoginScreen, DriverDashboard) | — | — |
| Frontend (user-app) | 5 (checkout, order/[id], orders, orderApi, cartStore) | — | — |
| Tooling & test | 3 (test files, migration manifest, check-route-security) | `smoke-happy-path.js`, `hardening.contract.test.ts`, `driverAuth.service.test.ts` | 10 new tests total |
| **Total** | **29 modified** | **6 new** | **10 contract + smoke** |

---

## 4. Deploy checklist

Before pushing to production:

- [ ] Provision `DRIVER_JWT_SECRET` and `OTP_HASH_SECRET` in the production environment (min 32 chars each). Existing driver tokens invalidate on first deploy with `DRIVER_JWT_SECRET` set — drivers re-login once.
- [ ] Apply `supabase_migrations/055_atomic_promo_and_claim_offer.sql` and `056_zone_neighbors_and_service_fee.sql` to production Supabase (safe to apply before or after backend deploy; backend detects and falls back).
- [ ] Verify `app_settings.checkout_service_fee_centimes` is set (default 200 = 2 DH if missing).
- [ ] Seed `delivery_zones.neighbor_zone_ids` if adding a city beyond Safi (migration 056 seeds Safi's graph).
- [ ] Set `OTP_DELIVERY_FROZEN=false` in production **only when you're ready to unfreeze provider OTP** (Wasender/Meta/Twilio). Until then, driver login works (CIN+password), customer bootstrap OTP stays frozen.
- [ ] Trust proxy is enabled for production (`app.ts` line 34 — already done).
- [ ] Redis is reachable (rate limiters fall back to memory if not, but driver revocation cache and commission locking need Redis for correctness).
- [ ] Run `npm run smoke:happy-path` against staging post-deploy to verify the full flow end-to-end.

---

**Next action:** decide on the local env safety approach (staging split vs. hard guard), then run the staging smoke.
