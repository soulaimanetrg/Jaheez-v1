# JAHEEZ - Delivery Platform for Safi, Morocco

JAHEEZ is a multi-app motorcycle-delivery platform for Safi, Morocco. It has a customer mobile app, a driver mobile app, an admin dashboard, and a backend-authoritative TypeScript API.

The current architecture goal is strict backend authority:

```text
Frontend/UI
-> API client
-> Express route/middleware
-> Controller
-> Service
-> Repository
-> Supabase PostgreSQL / Redis / Socket.IO / Moroccan payment provider adapter
```

Frontend apps should collect input and display results. They must not own pricing, payments, driver assignment, lifecycle transitions, wallet/COD balances, authorization decisions, or direct business-critical database mutations.

Online card payments are intentionally paused. Legacy Stripe routes must keep returning `410 Gone`; do not add Stripe secrets to active env files. JAHEEZ will only enable online payment after a Morocco-compatible provider adapter passes staging validation.

For operational source-of-truth documents, see [docs/ACTIVE_OPERATOR_DOCS.md](docs/ACTIVE_OPERATOR_DOCS.md). The machine-readable readiness contract is [docs/PRODUCTION_READINESS_MANIFEST.json](docs/PRODUCTION_READINESS_MANIFEST.json).

---

## Current Project Layout

```text
Jaheez-v1/
  backend/                  Express + TypeScript MVC backend
    src/
      features/             Domain modules: auth, checkout, customer, driver, admin, dispatch, realtime, order lifecycle
      middleware/           Auth, RBAC, validation, error handling
      redis/                Redis client
      workers/              Dispatch and heartbeat workers

  frontend/
    user-app/               Expo SDK 55 customer app
    driver-app/             Expo SDK 55 driver app
    admin/                  Vite + React admin dashboard

  supabase_migrations/      Database migrations
  shared/                   Shared types/constants
  scripts/                  Test/dev scripts and proxy
  docs/                     Architecture and audit documents
```

The active mobile apps are under `frontend/`. Do not run Expo from old root-level `user-app` or `driver-app` paths.

---

## Applications

### Backend

Stack:

- Node.js
- Express
- TypeScript
- Supabase PostgreSQL
- Redis
- Socket.IO
- Provider-neutral payments boundary (online payments currently disabled)
- JWT
- Zod validation

Backend status:

- `npm.cmd run build --prefix backend` passes.
- The active backend is under `backend/src/features`.
- Dispatch and heartbeat workers are attached from `backend/src/server.ts`.
- Socket.IO server is attached to the backend HTTP server.
- Redis is temporary memory only, not permanent truth.
- Supabase/PostgreSQL remains the source of truth.

### User App

Path:

```text
frontend/user-app
```

Stack:

- Expo SDK 55
- React Native
- TypeScript
- Expo Router
- Supabase Auth
- Backend API clients

The user app uses `expo-router/entry` as its package entry.

### Driver App

Path:

```text
frontend/driver-app
```

Stack:

- Expo SDK 55
- React Native
- TypeScript
- Expo Router
- CIN/password driver auth
- Location heartbeat
- Driver order flow

The driver app uses `expo-router/entry` as its package entry.

### Admin Dashboard

Path:

```text
frontend/admin
```

Stack:

- Vite
- React
- TypeScript
- Tailwind/Radix UI
- Backend admin API

Default dev port:

```text
http://localhost:3000
```

---

## Recent Backend Hardening

### Dispatch and Driver Reliability

The delivery dispatch model now has a backend-owned foundation for driver eligibility, cooldowns, reliability, store capacity, and offer history.

Driver states:

```text
AVAILABLE
OFFERED
ACCEPTED
PICKUP
DELIVERING
BREAK
FORCED_BREAK
OFFLINE
PAUSED_BY_SYSTEM
SUSPENDED
```

Important rule:

```text
DECLINED, TIMED_OUT, and REASSIGNED are offer/history events, not driver states.
```

Driver eligibility requires:

- state is `AVAILABLE`
- shift is active
- active orders are zero
- no future cooldown exists
- driver is not suspended, paused, in break, or in forced break
- heartbeat/location is fresh enough
- phase-1 capacity is one active order per driver

Persisted cooldown fields:

```text
cooldown_until
cooldown_reason
```

Allowed cooldown reasons:

```text
DECLINED_OFFER
TIMED_OUT
BREAK_ABUSE
ADMIN_ACTION
```

Reliability foundation:

- `driver_reliability_score` from 0 to 100
- periodic `driver_reliability_snapshots`
- score inputs include acceptance, timeout, warning, and suspicious behavior signals
- score is used for dispatch priority and admin review; reliability deductions do not reduce earned commission

Store capacity states:

```text
OPEN
BUSY
OVERLOADED
CLOSED
```

Dispatch modes:

```text
AUTO_DISPATCH
MANUAL_DISPATCH
```

Manual dispatch can block automatic assignment for targeted stores/zones/orders.

Offer history events:

```text
offered
accepted
declined
timed_out
expired
reassigned
cancelled_after_accept
emergency_reassignment_requested
```

### Database Migration

Latest dispatch/reliability migration:

```text
supabase_migrations/024_driver_dispatch_reliability.sql
```

It adds:

- driver cooldown fields
- shift/active-order capacity fields
- reliability score and snapshots
- driver state, shift, and break history tables
- dispatch offer history
- store capacity state
- dispatch mode
- customer reliability fields for fraud/support/account review only

Customer reliability must not influence dispatch driver selection.

---

## Running The Project

Use separate terminals.

### 1. Install Dependencies

From the repo root:

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1
npm.cmd install
npm.cmd install --prefix backend
npm.cmd install --prefix frontend\user-app
npm.cmd install --prefix frontend\driver-app
npm.cmd install --prefix frontend\admin
```

### 2. Configure Environment Files

The repo currently expects environment files in:

```text
backend/.env
frontend/user-app/.env
frontend/driver-app/.env
frontend/admin/.env
```

Backend required values include:

```text
PORT
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
ADMIN_JWT_SECRET
```

Optional/feature-specific values include:

```text
REDIS_URL
REDIS_REQUIRED
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
ONLINE_PAYMENTS_ENABLED
PAYMENT_PROVIDER
INFOBIP_API_KEY
INFOBIP_BASE_URL
```

Frontend values typically include:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_URL
```

Admin values typically include:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL
```

### 3. Start Redis

Redis is used for heartbeat, geo coordinates, locks, and short-lived dispatch state.

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1
npm.cmd run redis:docker
```

If `REDIS_REQUIRED=false`, the backend can start without Redis, but realtime dispatch behavior will be limited.

### 4. Start Backend

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1
npm.cmd run build --prefix backend
npm.cmd run dev --prefix backend
```

Default backend port:

```text
http://localhost:3002
```

### 5. Start User App

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\user-app
npm.cmd run start
```

If Metro/Expo cache causes problems:

```powershell
npx expo start -c
```

### 6. Start Driver App

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\driver-app
npm.cmd run start
```

Or:

```powershell
npx expo start -c
```

### 7. Start Admin Dashboard

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\admin
npm.cmd run dev
```

Default admin URL:

```text
http://localhost:3000
```

---

## Expo Troubleshooting

Use lowercase:

```powershell
npx expo start
```

Not:

```powershell
npx expo START
```

Most common Expo errors in this repo come from one of these:

1. Running Expo from the wrong folder.

   Correct:

   ```powershell
   cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\user-app
   npx expo start -c
   ```

   or:

   ```powershell
   cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\driver-app
   npx expo start -c
   ```

2. Running from the repo root.

   The root `package.json` is not an Expo app.

3. Stale Metro cache.

   Fix:

   ```powershell
   npx expo start -c
   ```

4. Missing dependencies in that specific app folder.

   Fix:

   ```powershell
   npm.cmd install
   ```

5. Backend not running.

   The mobile apps need the backend API available, normally at:

   ```text
   http://localhost:3002
   ```

6. Wrong API URL for a physical phone.

   If testing on a real phone, `localhost` means the phone itself, not your laptop. Use your computer LAN IP in the Expo env/API config, for example:

   ```text
   http://192.168.x.x:3002
   ```

---

## Backend Build And Verification

Backend build:

```powershell
npm.cmd run build --prefix backend
```

Current status:

```text
PASSING
```

Useful scans:

```powershell
rg "PICKED_UP|state:\s*'DECLINED'|state:\s*'TIMED_OUT'|state:\s*'REASSIGNED'" backend/src -g "*.ts"
rg "cooldown_until|cooldown_reason|driver_reliability_score|FORCED_BREAK|store_capacity_state|MANUAL_DISPATCH" backend/src supabase_migrations -g "*.ts" -g "*.sql"
rg "customer_reliability_score|customer_no_show|customer_unreachable|customer_refund_abuse" backend/src supabase_migrations -g "*.ts" -g "*.sql"
```

Expected current result:

- no old `PICKED_UP` driver state
- no `DECLINED`, `TIMED_OUT`, or `REASSIGNED` driver states
- customer reliability appears only as fraud/support/account-review persistence, not dispatch ranking

---

## Architecture Rules

Forbidden in production paths:

- frontend business calculations
- frontend payment authority
- frontend wallet/COD authority
- frontend role authorization
- frontend order lifecycle authority
- direct frontend database mutations for business-critical writes
- controllers accessing Supabase directly
- repositories calling external APIs directly
- services mutating Express response objects
- Redis as permanent truth
- Socket.IO handlers mutating critical state without service validation
- fallback JWT secrets
- default admin credentials
- mock/demo production logic
- duplicate checkout/finance/order lifecycle authority

Violation labels:

```text
ARCHITECTURE VIOLATION
SECURITY VIOLATION
DESYNC RISK
```

---

## Operational Model

Driver compensation model:

- drivers are paid through backend-owned commission and finance settlement flows
- admin-managed delivery/tip commission rates are snapshotted when deliveries are finalized
- closed shifts require finance review before payment
- COD tracks full cash physically collected
- reliability affects dispatch priority and admin review; delay points do not reduce earned commission

Dispatch model:

- backend owns assignment
- Redis is ephemeral for heartbeat, geo, locks, and offer timers
- PostgreSQL stores official states, cooldowns, scores, snapshots, and audit/history
- distance is useful but must not dominate dispatch ranking
- manual dispatch mode exists for operational emergencies

---

## Current Notes

- The repo is in an active stabilization phase and has a dirty worktree.
- `backend/` is the production authority target.
- Old legacy/prototype app roots are not the active run targets.
- Backend build currently passes.
- Runtime integration tests still require a live Supabase project, valid environment secrets, and the backend server running.
