# JAHEEZ Production Readiness Plan

## Goal
Make JAHEEZ ready for real-life production as a delivery and errands platform in Morocco, starting in Safi.

This plan is divided into phases. Each phase has a clear problem, target outcome, required work, and validation checklist.

## Priority Levels
```text
P0 = Critical before any real launch
P1 = Required before public beta
P2 = Important after MVP launch
P3 = Nice improvement later
```

## Current Readiness Assessment
```text
Production readiness: 35-45%
MVP prototype readiness: 65-70%
Real business operational readiness: 30-40%
```

The product direction and architecture are promising, but JAHEEZ is not ready for real production until schema, dispatch, security, admin operations, finance, and QA are stabilized.

## Phase 0: Freeze Source Of Truth
Priority: P0

Problem: The project has had old folders, new folders, schema mismatches, generated leftovers, and compatibility fallbacks.

Goal: Make one clear source of truth for frontend, backend, database, and docs.

Tasks:
- Confirm active app roots: `frontend/user-app`, `frontend/driver-app`, `frontend/admin`, `backend`, `shared`.
- Keep old/prototype roots out of active development.
- Confirm one active Supabase project.
- Confirm one backend base URL strategy for local, staging, and production.
- Confirm one `.env.example` per app.
- Keep `README.md` and architecture docs aligned with real folder structure.

Validation:
- No active imports from deleted/prototype roots.
- Backend starts cleanly.
- User app starts cleanly.
- Driver app starts cleanly.
- Admin app starts cleanly.
- Environment docs match real variables.

## Phase 1: Database And Supabase Schema
Priority: P0

Problem: Backend code expects columns and tables that live Supabase may not have. This caused dispatch and driver heartbeat failures.

Goal: Make database schema match backend code exactly.

Required tables:
- `users`
- `drivers`
- `orders`
- `order_items`
- `stores`
- `delivery_zones`
- `driver_locations`
- `dispatch_offer_history`
- `driver_state_history`
- `driver_shift_records`
- `driver_break_records`
- `driver_reliability_snapshots`
- `support_requests`
- `payments`
- `notifications`

Required dispatch columns:
- `drivers.shift_active`
- `drivers.active_orders`
- `drivers.max_active_orders`
- `drivers.cooldown_until`
- `drivers.cooldown_reason`
- `drivers.driver_reliability_score`
- `drivers.zone_id`
- `stores.zone_id`
- `stores.store_capacity_state`
- `stores.dispatch_mode`
- `delivery_zones.dispatch_mode`
- `orders.dispatch_mode`
- `orders.offered_driver_id`
- `orders.offer_expires_at`
- `orders.rejected_driver_ids`

Tasks:
- Audit all existing migration files.
- Apply missing migrations safely to the active Supabase project.
- Verify indexes for dispatch and order lookup.
- Verify RLS policies for user, driver, admin, and service-role access.
- Verify RPC functions used by checkout and lifecycle.
- Remove temporary schema compatibility fallbacks once production schema is correct.

Validation:
- Backend dispatch queries run without fallback.
- Driver heartbeat updates `shift_active` successfully.
- Cash order gets `offered_driver_id` automatically.
- No `column does not exist` or `Could not find column` errors in backend logs.

## Phase 2: Backend Runtime And Infrastructure
Priority: P0

Problem: Dispatch workers and heartbeats need a reliable runtime. Redis is not currently installed/running locally.

Goal: Make backend reliable in development and production.

Tasks:
- Choose Redis provider for production: managed Redis, Upstash, or Redis Cloud.
- Configure `REDIS_URL` for production.
- Decide if `REDIS_REQUIRED=true` in production.
- Keep PostgreSQL fallback for local development only.
- Add health checks for backend, Supabase, Redis, and dispatch worker.
- Add logs for pending orders count, eligible drivers count, offer created, offer expired, no eligible driver, and worker errors.
- Add process restart strategy for production.

Validation:
- Backend starts cleanly.
- Dispatch works with Redis.
- Local fallback works without Redis.
- Logs explain why an order was not dispatched.

## Phase 3: Order Lifecycle
Priority: P0

Problem: Stale active orders can block drivers. Status transitions need to be strict and recoverable.

Goal: Make every order move through a controlled lifecycle.

Order statuses:
```text
pending
confirmed
preparing
picked_up
delivered
completed
cancelled
```

Driver stages:
```text
offered
accepted
arrived_pickup
picked_up
arrived_customer
delivered
```

Tasks:
- Audit status transition RPC.
- Prevent invalid transitions.
- Add cancellation rules per actor.
- Add offer timeout handling.
- Add reassignment flow.
- Add admin manual override.
- Ensure completed/cancelled orders release drivers.
- Add stuck order cleanup tools.

Validation:
- Cash order dispatches.
- Online-payment order dispatches only after the selected Moroccan provider confirms payment.
- Driver can accept.
- Driver can update stages.
- Driver can complete delivery.
- Admin can reassign.
- Completed/cancelled order releases driver.

## Phase 4: Driver Dispatch System
Priority: P0

Problem: Commission-based drivers may cherry-pick, ignore orders, or stall active deliveries if dispatch, reliability, and payout review are weak.

Goal: Make dispatch automatic, fair, and abuse-resistant.

Candidate rules:
```text
is_active = true
is_verified = true
is_online = true
shift_active = true
state = AVAILABLE
active_orders = 0
not paused
not suspended
not in cooldown
not rejected same order
```

Sorting rules:
```text
same zone
fewest deliveries today
longest since last assignment
highest reliability
lowest timeouts
lowest warning count
```

Tasks:
- Backend-owned availability.
- No manual online/offline toggle.
- Shift-based availability.
- One active delivery per driver.
- Hide tips before completion.
- Add pickup code from store.
- Add delivery code from customer.
- Add decline reasons.
- Add timeout penalties.
- Add forced break after repeated ignored offers.
- Add reliability score.
- Add admin driver controls.

Validation:
- Driver receives order automatically.
- Driver cannot browse all orders freely.
- Driver cannot see tip before accepting/completing.
- Ignored offer expires.
- Repeated ignored offers causes cooldown or forced break.
- Active delivery prevents new assignment.
- Completed delivery releases driver.

## Phase 5: Driver App
Priority: P0/P1

Problem: Driver app must be operationally reliable, not just visually working.

Tasks:
- Global heartbeat.
- Clear availability status.
- Offer modal with countdown.
- Reliable available-order polling or Socket.IO listener.
- Active delivery screen.
- Store contact and customer contact.
- Stage update buttons.
- Problem report flow.
- Cancellation with reason.
- Offline and expired-session handling.
- Background and foreground behavior.
- Pickup and delivery code screens.

Validation:
- Driver logs in.
- Heartbeat reaches backend.
- Driver becomes available.
- Offer appears.
- Accept works.
- Stage updates work.
- Delivery complete works.
- Driver receives next order after completion.

## Phase 6: User App
Priority: P0/P1

Problem: User app must be stable through real customer flows.

Tasks:
- Login, register, OTP.
- Store browsing.
- Search and categories.
- Product details and options.
- Cart.
- Address management.
- Checkout.
- Cash order.
- Online-payment order only if a Moroccan provider is enabled after staging validation.
- Order tracking.
- Support/chat.
- Cancellation.
- Notifications.
- Loading/error/empty states.
- Arabic, French, and English correctness.

Validation:
- Full cash order from user app to driver delivery.
- Full online-payment order from user app to provider confirmation only after the provider feature flag is enabled.
- User sees order status changes.
- User receives cancellation/refund state.
- App behaves on bad network.

## Phase 7: Admin Panel
Priority: P0/P1

Problem: Admin panel is required for real operations. Without it, the business cannot rescue failures.

Required features:
- Live order dashboard.
- Manual driver assignment.
- Reassignment.
- Cancel and refund handling.
- Store controls.
- Driver controls.
- User controls.
- Support tickets.
- Risk/fraud view.
- COD settlement.
- Finance reports.
- Audit logs.
- App settings.

Validation:
- Admin can see stuck order.
- Admin can assign/reassign driver.
- Admin can pause driver.
- Admin can pause store.
- Admin can resolve support ticket.
- Admin actions are audited.

## Phase 8: Security
Priority: P0

Problem: The app needs a full security pass before real users.

Tasks:
- Audit Supabase RLS.
- Verify service-role key is backend-only.
- Rotate all exposed or old secrets.
- Add strong admin permissions.
- Add rate limits per auth endpoint.
- Add brute-force protection for driver login.
- Add password policy.
- Add audit logs.
- Validate all request bodies.
- Secure file uploads.
- Secure payment webhooks.
- Add production CORS allowlist.
- Add logging without leaking secrets.

Validation:
- User cannot read another user's order.
- Driver cannot claim unoffered order.
- Driver cannot update another driver.
- Admin permissions are role-based.
- Expired/invalid JWT is rejected.
- Service role key is not in frontend bundle.

## Phase 9: Payments, COD, And Finance
Priority: P0/P1

Problem: Money flow must be accurate before launch.

Tasks:
- Define cash order workflow.
- Define provider-neutral online-payment workflow; keep it disabled until a Moroccan provider is selected and validated.
- Verify the selected Moroccan payment provider's webhook or callback signature handling before online payments are enabled.
- Track COD balance per driver.
- Build COD settlement workflow.
- Define refund rules.
- Define tip rules.
- Build commission, COD, payout, and reliability reporting.
- Build finance admin dashboard.
- Build daily reconciliation.

Validation:
- Cash order increases driver COD balance.
- Driver settlement reduces COD balance.
- Online-payment order does not dispatch before provider-confirmed payment.
- Refund is recorded.
- Tips are hidden before completion.
- Finance reports match orders.

## Phase 10: Notifications And Realtime
Priority: P1

Problem: Orders and dispatch need fast updates.

Tasks:
- Push notifications.
- Socket.IO offer events.
- Socket.IO status events.
- User tracking updates.
- Admin dashboard realtime.
- Fallback polling.
- Expired offer handling.

Validation:
- Driver gets offer instantly.
- User sees driver accepted.
- Admin sees live state.
- App still works if socket disconnects.

## Phase 11: Production Operations
Priority: P1

Problem: Real-life app needs monitoring, backups, and incident handling.

Tasks:
- Error tracking.
- Backend logs.
- Worker logs.
- Supabase backups.
- Restore test.
- Uptime monitoring.
- Rate-limit monitoring.
- Admin incident procedures.
- Test accounts.
- Seed data for staging.
- Separate staging and production.

Validation:
- Dispatch failure is detectable.
- Backend crash is detectable.
- DB backup can be restored.
- Production bug can be reproduced in staging.

## Phase 12: QA And Launch Testing
Priority: P0/P1

Test matrix:
- User app Android.
- User app iOS.
- Driver app Android.
- Driver app iOS.
- Admin desktop.
- Slow network.
- No internet.
- Expired session.
- Multiple drivers.
- Multiple orders.
- Store closed.
- Driver ignores offer.
- Driver accepts then cancels.
- Customer cancels.
- Admin reassigns.
- Cash order.
- Online-payment order only when the provider flag is enabled.
- Refund order.

Validation:
- 30-50 complete test orders.
- No stuck orders.
- No driver blocked forever.
- No wrong COD.
- No unauthorized data access.
- No app crash in main flows.

## Execution Sprints

### Sprint 1: Schema And Dispatch Stabilization
Priority: P0

Goal: Make the current order and driver dispatch system reliable.

Outcomes:
- Correct Supabase schema.
- Backend starts cleanly.
- Driver heartbeat works.
- Cash order is offered to driver.
- Driver accepts and completes delivery.
- Driver becomes available again.

### Sprint 2: Dispatch Hardening
Priority: P0

Goal: Stop commission/dispatch abuse and prevent stuck orders.

Outcomes:
- Shift system.
- One active order rule.
- Timeout/cooldown.
- Decline reasons.
- Admin reassignment.
- Pickup and delivery codes.

### Sprint 3: Admin Rescue Dashboard
Priority: P0

Goal: Give admins operational control.

Outcomes:
- Live orders.
- Manual assign/reassign.
- Driver controls.
- Store controls.
- Support tickets.
- Audit logs.

### Sprint 4: Security And RLS
Priority: P0

Goal: Make the app safe for real users and drivers.

Outcomes:
- RLS audit.
- Admin permissions.
- JWT and rate-limit hardening.
- Secret rotation.
- Upload and payment security.

### Sprint 5: User And Driver QA
Priority: P1

Goal: Stabilize mobile production behavior.

Outcomes:
- Full order flows.
- Loading/error states.
- Localization.
- Notifications.
- Realtime fallback.

### Sprint 6: Finance And Operations
Priority: P1

Goal: Make the business manageable day to day.

Outcomes:
- COD settlement.
- Refunds.
- Driver commission, COD, payout, and reliability reports.
- Monitoring.
- Backups.
