# Production Blockers Report

This document highlights the blocking issues categorized by severity (P0/P1) that must be resolved before releasing the JAHEEZ platform to any live testing or production environments.

---

## P0 Blockers (Must fix before Closed Beta / Testing)

### 1. Stripe Webhook Verification is Missing
- **Severity**: CRITICAL
- **Risk**: Bypassing the verification loop allows order payment spoofing, and customer orders will remain unpaid if the client loses network access or closes the app immediately after successful checkout.
- **Fix**: Implement a backend POST `/v1/payments/stripe/webhook` endpoint with Stripe signature verification using a secret `STRIPE_WEBHOOK_SECRET` to process payment events asynchronously.

### 2. Direct Frontend Supabase Reads & Writes
- **Severity**: CRITICAL
- **Risk**: Bypasses the unified Express MVC backend layer, exposing database tables directly to client-side API keys and allowing unauthorized database queries and data mutations if RLS fails.
- **Fix**: Migrate all client reads and writes for `user_addresses`, `wallets`, `support_requests`, and `orders` to REST endpoints on the Express MVC backend.

### 3. Rate Limiter Registered After Router Middleware
- **Severity**: HIGH
- **Risk**: General API rate limiting is completely bypassed because Express terminates the request-response cycle before reaching the rate limiter. Attackers can brute-force authentication and spam OTP requests.
- **Fix**: Move `app.use('/admin-api', apiLimiter)` to execute before any router registrations in `backend/src/app.ts`.

### 4. Socket.IO Client Missing in Driver & Admin Applications
- **Severity**: CRITICAL
- **Risk**: Real-time dispatching is broken. Driver dashboard is forced to use slow REST API polling every 15 seconds, creating delays in receiving unassigned order offers and causing high timeout rates.
- **Fix**: Install `socket.io-client` in `frontend/driver-app` and `frontend/admin` and establish a live WebSocket connection upon login to process real-time notifications.

### 5. HMR Web Socket Routing Conflict in proxy.js
- **Severity**: HIGH
- **Risk**: When running both apps locally, the driver-app HMR connection is incorrectly routed to the user-app's Metro server, causing Fast Refresh to fail and triggering constant browser reloads.
- **Fix**: Update the upgrade handler in `proxy.js` to inspect referer headers and route HMR WebSocket connections correctly based on application context.

---

## P1 Blockers (Must fix before Public Release / Deployment)

### 1. Redis Driver Online TTL Desync from PostgreSQL
- **Severity**: MEDIUM
- **Risk**: When a driver's app goes to the background, the Redis heartbeat key expires, but the driver remains marked as "Online" and "Available" in the database, causing dispatch assignment mismatch.
- **Fix**: Implement a background cleanup job in `driverHeartbeat.worker.ts` that updates the database status of offline drivers to `OFFLINE` when their Redis heartbeat expires.

### 2. Remove Deprecated Scripts
- **Severity**: MEDIUM
- **Risk**: Obsolete scripts like `scripts/admin-api.js` are still executed in build processes, leading to port collisions and configuration drift.
- **Fix**: Delete `scripts/admin-api.js` and clean up launch scripts in `package.json`.

### 3. Strict Input Schema Validations
- **Severity**: MEDIUM
- **Risk**: Unsanitized payloads sent to controllers could result in database casting errors or unexpected exceptions.
- **Fix**: Ensure Zod schemas validation middleware is thoroughly mounted on all Express routers.

---

## Production Verdict

- **Safe for internal testing**: Only within controlled development environments.
- **Safe for closed beta**: **No**
- **Safe for public beta**: **No**
- **Safe for production**: **No**

**Final Verdict**: **UNSAFE FOR RELEASE**
