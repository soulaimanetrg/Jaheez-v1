# Sprint 1: Schema And Dispatch Stabilization

## Goal
Make the current JAHEEZ order dispatch system reliable enough to support real operational testing.

## Current Known Issues
- Live Supabase schema is behind backend code.
- Some dispatch columns from migrations `023` and `024` are missing in the active database.
- Redis is not installed/running locally.
- Backend currently uses PostgreSQL fallback for Redis in local development.
- Stale active orders can block a driver from receiving new orders.
- Driver offer popup uses Socket.IO events with polling fallback.
- Dispatch history/reliability audit writes are skipped in local compatibility mode until migration `024` is applied.

## Current Execution Status
Last updated: 2026-06-16

Completed:
- Backend starts on `3002`.
- Redis is disconnected, but backend dispatch runs with PostgreSQL fallback in local development.
- Driver heartbeat endpoint returns `200` with current schema compatibility fallback.
- Dispatch worker can offer a cash `confirmed` order to the target driver.
- Driver available-orders API returns the offered order.
- Driver claim API works.
- Driver stage updates work through `arrived_pickup`, `picked_up`, `arrived_customer`, and `delivered`.
- Delivered order releases driver back to `AVAILABLE`.
- Offer fields are cleared after claim and remain cleared after delivery.
- Structured decline API works and records the driver in `orders.rejected_driver_ids`.
- Declined drivers are excluded from stale dispatch snapshots before a new offer is written.
- Admin manual reassignment route is authorized, assigns through backend service/repository flow, writes order status history, and supports delivery completion afterward.
- Driver tokens are rejected by the admin reassignment route with `401 wrong_kind`.
- Expired offer timeout processing uses guarded repository writes, clears stale offers, rejects timed-out drivers, increments timeout counters, and blocks expired claims.
- Stale timeout snapshots do not clear newer active offers.
- Pickup/delivery confirmation-code backend path is implemented and schema-compatible.
- Stage route validation rejects unexpected client fields.
- Driver shift start/end backend routes are implemented and protected by driver auth.
- Driver dashboard exposes start/end shift controls backed by those routes.
- Driver profile, heartbeat, and shift responses no longer expose `password_hash`.
- Ending shift is blocked during active delivery.
- Admin unassign/rescue path now uses compatibility-aware lifecycle writes and propagates failures.
- Driver tokens are rejected by the admin unassign/rescue route.
- Driver app listens for authenticated Socket.IO offer, expiry, and reassignment events while keeping polling fallback.
- Socket auth now rejects admin tokens when `actor = driver` by enforcing JWT `kind` in shared JWT verification.
- Driver realtime room authorization and `order:offered` delivery were verified against the running backend.
- Repeatable backend regression script exists at `backend/scripts/regression-dispatch-security.js` and passes.
- User app TypeScript passes.
- User app Android export passes.
- User Expo Doctor remains `18/19` with only the native-folder/app-config sync warning.
- Admin panel production build passes.
- Backend TypeScript passes.
- Driver app TypeScript passes.
- Driver Expo Doctor passes `19/19`.
- Driver Android export passes.

Blocked:
- Direct migration application is blocked because the configured `DATABASE_URL` fails password authentication for the `postgres` user.
- Supabase CLI project access is blocked because no `SUPABASE_ACCESS_TOKEN` is configured.
- Redis production verification is blocked until a Redis provider or local Redis service is available.

Temporary compatibility:
- Backend currently contains schema compatibility fallback for missing hardening columns.
- Missing dispatch history/reliability tables or columns log explicit warnings and do not break offer/decline flow.
- Confirmation-code enforcement is compatible but inactive until migration `025` adds the required columns.
- Remove this fallback after migrations `023`, `024`, and `025` are applied successfully to the active Supabase database.

## Success Criteria
- Backend starts cleanly on `3002`.
- Driver app heartbeat returns `200`.
- Driver becomes `AVAILABLE`.
- Cash order becomes `confirmed` or `preparing`.
- Dispatch writes `orders.offered_driver_id` within one worker cycle.
- Driver app shows the offer.
- Driver can accept the order.
- Driver can progress stages to delivered.
- Driver becomes available again after completion.
- Driver can decline a structured offer reason without being immediately re-offered the same order.
- Operations/admin can manually assign a dispatchable order without bypassing admin auth or repository write checks.
- Expired offers are processed without clearing newer active offers or allowing late claims.
- Pickup and delivery stages support backend-enforced confirmation codes after migration `025` is applied.
- Driver shifts can be explicitly started/ended; heartbeat respects `shift_active = false` after migration `023` is applied.
- Driver app can start/end shifts from the dashboard, with active-delivery protection enforced by backend.
- Admin unassign can safely remove a stalled driver, mark them rejected for that order, and return the order to dispatch/admin rescue.
- Driver app can refresh offers from realtime events without trusting socket payloads as source of truth.
- Regression script can validate dispatch/security flows with one command.

## Step 1: Confirm Active Environment
Priority: P0

Tasks:
- Confirm active Supabase project.
- Confirm `backend/.env` points to the intended project.
- Confirm `frontend/driver-app/.env` points to the same project.
- Confirm backend base URL for device/emulator.
- Confirm backend health endpoint works.

Commands:
```powershell
cd backend
npm run dev
```

```powershell
Invoke-RestMethod http://localhost:3002/health
```

Validation:
- Health response has `ok: true`.
- Backend logs show worker startup.
- No environment validation errors.

## Step 2: Fix Supabase Schema
Priority: P0

Status: Blocked for direct migration. Running with compatibility fallback until valid database migration access is available.

Tasks:
- Apply missing migration `023_driver_store_delivery_zones.sql`.
- Apply missing migration `024_driver_dispatch_reliability.sql`.
- Verify required dispatch columns exist.
- Verify dispatch history tables exist.
- Verify RLS policies exist for service-role access.

Required columns:
- `drivers.shift_active`
- `drivers.active_orders`
- `drivers.max_active_orders`
- `drivers.cooldown_until`
- `drivers.cooldown_reason`
- `drivers.driver_reliability_score`
- `stores.store_capacity_state`
- `stores.dispatch_mode`
- `delivery_zones.dispatch_mode`
- `orders.dispatch_mode`

Validation:
- No backend log contains `Could not find the`.
- No backend log contains `column does not exist`.
- Temporary schema fallbacks can be removed after schema is correct.

## Step 3: Stabilize Redis Strategy
Priority: P0

Tasks:
- Keep PostgreSQL fallback for local development.
- Decide production Redis provider.
- Configure production `REDIS_URL`.
- Decide whether production uses `REDIS_REQUIRED=true`.
- Add Redis run instructions for local dev.

Local status:
- Docker is not installed.
- WSL command exists, but no Linux distro is configured.
- Direct Windows Redis is not installed.

Validation:
- Local dispatch works without Redis.
- Production plan includes managed Redis.

## Step 4: Verify Driver Heartbeat
Priority: P0

Tasks:
- Login to driver app.
- Confirm global heartbeat runs from root layout.
- Confirm `PATCH /admin-api/driver/me/location` returns `200`.
- Confirm driver state becomes `AVAILABLE` when not busy.

Validation query:
```sql
select id, full_name, is_online, state, last_seen_at
from drivers
order by updated_at desc
limit 10;
```

Expected:
```text
is_online = true
state = AVAILABLE
last_seen_at is recent
```

## Step 5: Verify Order Dispatch
Priority: P0

Tasks:
- Create a cash order from user app.
- Confirm order status is `confirmed` or `preparing`.
- Wait for dispatch worker cycle.
- Confirm `offered_driver_id` is set.

Validation query:
```sql
select id, status, driver_id, offered_driver_id, offer_expires_at, created_at
from orders
where driver_id is null
and status in ('confirmed', 'preparing')
order by created_at desc;
```

Expected:
```text
offered_driver_id is not null
offer_expires_at is in the future
```

Guardrails:
- Offer writes are guarded against stale dispatch snapshots.
- A driver listed in `rejected_driver_ids` must not receive the same order again.

## Step 6: Verify Driver Accept Flow
Priority: P0

Tasks:
- Open driver app on dashboard.
- Confirm offer modal appears.
- Accept before 45 seconds.
- Confirm order gets `driver_id`.
- Confirm driver state becomes `ACCEPTED`.

Validation:
- Driver is routed to active delivery screen.
- Order is visible under `mine`.
- Same order is not offered to another driver.

## Step 7: Verify Delivery Completion
Priority: P0

Tasks:
- Mark arrived pickup.
- Mark picked up.
- Mark arrived customer.
- Mark delivered.
- Confirm driver is released.

Expected final state:
```text
order.status = delivered
driver.state = AVAILABLE
driver.active_orders = 0
order.offered_driver_id = null
order.offer_expires_at = null
```

## Step 7.1: Verify Driver Decline Flow
Priority: P0

Tasks:
- Wait for an offered order.
- Decline with a structured reason and optional note.
- Confirm offer fields clear.
- Confirm driver is added to `rejected_driver_ids`.
- Confirm driver returns to `AVAILABLE`.
- Confirm the same driver is not re-offered the declined order.

Expected state with current schema compatibility fallback:
```text
order.driver_id = null
order.offered_driver_id = null
order.offer_expires_at = null
order.rejected_driver_ids contains driver id
driver.state = AVAILABLE
dispatch_offer_history unavailable until migration 024 is applied
```

## Step 7.2: Verify Admin Manual Reassignment
Priority: P0

Tasks:
- Call `POST /admin-api/v1/admin/orders/:id/reassign` with an admin token and `target_driver_id`.
- Confirm route requires `super_admin` or `operations` role.
- Confirm driver tokens are rejected by admin auth.
- Confirm order is assigned to the target driver.
- Confirm offer fields are cleared.
- Confirm target driver becomes `ACCEPTED`.
- Confirm `order_status_history` records `driver_assignment` with `actor_type = admin`.
- Complete driver stages to delivered and confirm driver returns to `AVAILABLE`.

Expected:
```text
order.driver_id = target_driver_id
order.offered_driver_id = null
order.offer_expires_at = null
driver.state = ACCEPTED after assignment
driver.state = AVAILABLE after delivery
driver token receives 401 wrong_kind on admin route
```

## Step 7.3: Verify Offer Timeout Flow
Priority: P0

Tasks:
- Create or force an expired active offer.
- Wait for the timeout worker cycle.
- Confirm offer fields are cleared.
- Confirm timed-out driver is added to `rejected_driver_ids`.
- Confirm driver timeout counters increment.
- Confirm driver returns to `AVAILABLE` or penalty state according to timeout count.
- Confirm the driver cannot claim the expired offer afterward.
- Confirm stale timeout snapshots do not clear a newer active offer.

Expected:
```text
order.offered_driver_id = null after timeout
order.offer_expires_at = null after timeout
order.rejected_driver_ids contains timed-out driver id
driver.driver_timeout_count increments
late claim is rejected
future active offer remains intact when stale timeout guard runs
```

## Step 7.4: Verify Pickup And Delivery Confirmation Codes
Priority: P0

Status: Backend path implemented. Full enforcement is blocked until migration `025_order_confirmation_codes.sql` is applied.

Tasks:
- Apply migration `025_order_confirmation_codes.sql`.
- Confirm claimed orders receive `pickup_confirmation_code` and `delivery_confirmation_code`.
- Confirm `picked_up` requires the valid pickup code.
- Confirm `delivered` requires the valid delivery code.
- Confirm invalid or missing codes return `400`.
- Confirm stage route rejects unexpected client fields.
- Confirm successful pickup/delivery writes confirmation timestamps.

Current compatibility validation:
```text
live schema is missing confirmation-code columns
backend logs explicit compatibility warnings
claim and delivery lifecycle still works with current schema
stage route rejects unexpected fields with 400 validation_failed
```

Expected after migration `025`:
```text
orders.pickup_confirmation_code is generated on claim
orders.delivery_confirmation_code is generated on claim
picked_up requires pickup code
delivered requires delivery code
orders.pickup_confirmed_at is set after valid pickup code
orders.delivery_confirmed_at is set after valid delivery code
```

## Step 7.5: Verify Driver Shift Controls
Priority: P0

Status: Backend routes implemented. Full heartbeat gating requires migration `023` because the current live schema is missing `drivers.shift_active`.

Tasks:
- Call `POST /admin-api/driver/me/shift/start` with a driver token.
- Call `POST /admin-api/driver/me/shift/end` with a driver token.
- Confirm admin tokens are rejected by driver auth.
- Confirm ending shift sets driver offline when no active delivery exists.
- Confirm ending shift during active delivery returns `409`.
- Confirm profile, heartbeat, and shift responses do not include `password_hash`.
- After migration `023`, confirm heartbeat does not automatically start a shift when `shift_active = false`.

Current compatibility validation:
```text
start shift returns 200 with safe driver payload
end shift returns 200 with safe driver payload when idle
end shift during active delivery returns 409
admin token on driver shift route returns 401
password_hash is not present in driver profile, heartbeat, or shift responses
```

Expected after migration `023`:
```text
drivers.shift_active = true after start shift
drivers.shift_active = false after end shift
heartbeat keeps driver non-dispatchable while shift_active = false
dispatch excludes shift_active = false drivers
```

## Step 7.6: Verify Admin Unassign / Rescue Path
Priority: P0

Tasks:
- Assign an active order to a driver.
- Call `POST /admin-api/v1/admin/orders/:id/reassign` with `target_driver_id = null` using an operations/admin token.
- Confirm driver tokens are rejected by admin auth.
- Confirm the order is unassigned and returned to `confirmed`.
- Confirm offer fields are cleared.
- Confirm the previous driver is added to `rejected_driver_ids`.
- Confirm the previous driver is released to `AVAILABLE` or `OFFLINE` based on online state.
- Manually assign a rescue driver and complete delivery.

Expected:
```text
driver token receives 401 wrong_kind on admin unassign route
order.driver_id = null after unassign
order.offered_driver_id = null after unassign
order.offer_expires_at = null after unassign
order.rejected_driver_ids contains previous driver id
previous driver.state = AVAILABLE when online
rescue assignment can complete delivery
```

## Step 7.7: Verify Driver Realtime Offer Listener
Priority: P0

Tasks:
- Connect driver app socket with driver token and `actor = driver`.
- Join `driver:{driver_id}` room through backend room authorization.
- Listen for `order:offered`, `order:offer_expired`, and `order:reassigned`.
- On realtime event, refresh orders through authenticated HTTP API instead of trusting socket payload as order data.
- Keep 15-second polling fallback active.
- Confirm app build/export succeeds with `socket.io-client` bundled.

Expected:
```text
socket auth uses stored driver token
driver joins only authorized driver room
order:offered triggers available-order refresh
order:offer_expired closes matching popup and refreshes
order:reassigned closes matching popup and refreshes
polling fallback remains active
```

## Step 8: Remove Temporary Compatibility Code
Priority: P1

Only do this after Supabase schema is correct.

Tasks:
- Remove legacy missing-column fallbacks.
- Keep one production schema path.
- Re-run backend TypeScript.
- Re-run full dispatch test.

Validation:
- Backend logs stay clean.
- Dispatch still works.

## Step 9: Regression Checks
Priority: P0

Commands:
```powershell
cd backend
npx.cmd tsc --noEmit
node -r ts-node/register scripts/regression-dispatch-security.js
```

```powershell
cd frontend/driver-app
npx.cmd tsc --noEmit
npx.cmd expo-doctor
npx.cmd expo export --platform android --output-dir .expo-debug-export --clear
```

Validation:
- TypeScript passes.
- Dispatch/security regression passes.
- Expo Doctor passes `19/19`.
- Android export passes.
- Temporary `.expo-debug-export` is removed.

## Open Decisions
- Which Supabase project is production?
- Which Redis provider will production use?
- Will card payments be enabled for MVP?
- Should dispatch be fully automatic at launch, or admin-assisted for beta?
- Will tips be personal or pooled?
- Will pickup/delivery confirmation use codes, photos, or both?
