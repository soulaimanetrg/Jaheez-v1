# Backend Audit

## Verdict

Status: BROKEN BUILD, SPLIT AUTHORITY

JAHEEZ has two backend implementations:

1. `scripts/admin-api.js`: legacy active monolith on port `3001`.
2. `backend/src/**`: intended MVC backend, but build fails and route coverage is incomplete.

## New MVC Backend

Positive:

- Has routes, controllers, services, repositories, middleware, validators.
- Checkout service does server-side store/menu lookup and order total calculation.
- Driver service has Redis GEO/heartbeat logic.

Critical failures:

- Does not compile.
- Defaults to port `3001` while proxy expects restructured API at `3002`.
- Uses `/admin-api` namespace instead of clean `/api/v1`.
- API limiter is mounted after routers in `backend/src/app.ts`, so it does not protect the routes mounted before it.

## Legacy Monolith

File: `scripts/admin-api.js`

Status: LEGACY ACTIVE

Problems:

- Mixes routing, auth, validation, service logic, repositories, Supabase access, local PostgreSQL access, Stripe, OTP, finance, and notification logic in one file.
- Uses service-role Supabase for broad shared entities.
- Contains built-in mock admin fallback.
- Contains duplicated checkout/order status/driver finance logic also present in `backend/src/services`.
- Contains active KYC, payout, revenue share, OTP, wallet, COD, and Stripe flows.

## Backend Layer Violations

| Violation | Files | Severity |
|---|---|---|
| Controllers/services import missing errors, backend cannot build | `backend/src/**` | CRITICAL |
| Legacy route file contains all layers | `scripts/admin-api.js` | CRITICAL |
| Rate limiter mounted after routes | `backend/src/app.ts` | HIGH |
| New backend port conflicts with proxy expectation | `backend/src/config/env.ts`, `scripts/proxy.js` | HIGH |
| Driver finance logic duplicated | `checkout.service.ts`, `driver.service.ts`, `scripts/admin-api.js` | HIGH |
| Stripe exists in legacy, not new payment service | `scripts/admin-api.js`, `backend/package.json` | HIGH |
| Socket config unused | `backend/src/config/socket.ts`, `backend/src/server.ts` | HIGH |

## Required Backend Fix Sequence

1. Make `backend` compile.
2. Decide final API namespace and port.
3. Move all legacy endpoints required by apps into MVC routes/controllers/services/repositories.
4. Move Stripe into a payment service and require order_id-only session creation.
5. Move OTP into persistent/rate-limited service or remove if not needed.
6. Delete or quarantine `scripts/admin-api.js` from production startup.
