# Broken Features & Flows Report

This document maps all functional bugs, integration failures, and client-server synchronization issues identified in the JAHEEZ codebase during the audit.

---

## 1. Local HMR Web Socket Routing Conflict

* **Exact File Path**: `scripts/proxy.js`
* **Exact Function/Component**: WebSocket `upgrade` event handler (lines 287-328)
* **Root Cause**: The developer proxy server uses `isDriverAssetByContext(req, url)` to determine whether a WebSocket upgrade request belongs to the driver app (port 8082). However, `/hot` and `/message` HMR endpoints do not match the `isAssetLike` filter (which only includes `/node_modules/`, `/assets/`, etc.). As a result, WebSocket upgrades from the driver-app's Metro server default to `METRO_PORT` (port 8081 - user-app Metro). The user-app's Metro server receives HMR messages from a driver-app environment, resulting in a Fast Refresh error and triggering an infinite page reload loop.
* **Severity**: CRITICAL
* **Exploit / Risk**: Renders simultaneous local testing of both customer and driver apps impossible. Frontends constantly refresh, wiping app state during order placements or checkout validation testing.
* **Exact Fix**:
  Modify the `upgrade` event handler in `scripts/proxy.js` to inspect the `Referer` header or URL parameters for HMR routes and correctly route WebSocket connections to the driver app's Metro port (8082) if the request originated from a `/driver/` context:
  ```javascript
  server.on('upgrade', (req, clientSocket, head) => {
    const url = req.url || '/';
    const ref = req.headers.referer || req.headers.referrer || '';
    
    let targetPort = METRO_PORT;
    if (url.startsWith('/socket.io/')) {
      targetPort = NEW_MVC_API_PORT;
    } else if (isMockupPath(url)) {
      targetPort = MOCKUP_PORT;
    } else if (isAdminPath(url)) {
      targetPort = ADMIN_PORT;
    } else if (
      isDriverPath(url) || 
      url.includes('app=driver') || 
      ref.includes('/driver') ||
      (url.startsWith('/hot') && ref.includes('/driver')) ||
      (url.startsWith('/message') && ref.includes('/driver'))
    ) {
      targetPort = DRIVER_PORT;
    }
    // ...
  ```

---

## 2. Suspended & Rejected Driver Heartbeat Bypass

* **Exact File Path**: `backend/src/features/driver/driver.service.ts`
* **Exact Function/Component**: `updateLocation` (lines 207-215)
* **Root Cause**: The endpoint checks `if (driver.is_active === false)` but fails to verify if the driver is currently suspended (`suspension_until` timestamp in the future) or if their account validation status is rejected (`kyc_status === 'rejected'`).
* **Severity**: HIGH
* **Exploit / Risk**: 
  1. A driver who has been suspended for violating abuse rules (e.g. 3 warnings) or whose KYC has been rejected can continue sending GPS location updates to `/admin-api/driver/me/location`.
  2. The server responds with `200 OK` and updates their location coordinates and heartbeat TTL in Redis, keeping them online in Redis and generating telemetry data, which pollutes the logs and bypasses the suspension status.
* **Exact Fix**:
  Update lines 213-215 in `backend/src/features/driver/driver.service.ts`:
  ```typescript
  if (driver.is_active === false) {
    throw new ForbiddenError('Compte livreur suspendu ou inactif.');
  }

  const now = new Date();
  if (driver.suspension_until && new Date(driver.suspension_until) > now) {
    throw new ForbiddenError('Compte livreur temporairement suspendu.');
  }

  if (driver.kyc_status !== 'verified') {
    throw new ForbiddenError('Compte livreur non approuvé (statut KYC invalide).');
  }
  ```

---

## 3. Missing WebSocket Client in Frontends

* **Exact File Path**: 
  * `frontend/driver-app/features/delivery/views/DriverDashboardScreen.tsx`
  * `frontend/driver-app/package.json`
  * `frontend/admin/package.json`
* **Exact Function/Component**: Driver Dashboard view & Admin package dependencies
* **Root Cause**: The backend `DispatchService` broadcasts order offers (`order:offered`) and expirations (`order:offer_expired`) via Socket.IO. However, the driver-app and admin-app codebases are missing `socket.io-client` in their package dependencies and do not instantiate a Socket.IO connection. The driver-app falls back to polling the `/driver/orders?scope=available` REST API endpoint every 15 seconds.
* **Severity**: CRITICAL
* **Exploit / Risk**: 
  1. Polling introduces up to 15 seconds of latency before a driver sees an offered order.
  2. Since backend driver offers expire in exactly 45 seconds, the driver's response window is reduced to as little as 30 seconds.
  3. This delay results in high rates of automated timeouts, leading to rapid warning accumulation and unjustified driver bans under the abuse detection system.
* **Exact Fix**:
  1. Run `npm install socket.io-client` in both `frontend/driver-app` and `frontend/admin`.
  2. Initialize the client upon authentication:
     ```typescript
     import io from 'socket.io-client';
     const socket = io(PROXY_URL, {
       path: '/socket.io',
       auth: { token: jwtToken, actor: 'driver' }
     });
     ```
  3. Listen to `order:offered` to trigger a fullscreen modal overlay, and `order:offer_expired` to clear the offer immediately when the dispatch expires on the backend.

---

## 4. Web Client Stripe Redirect Cart Clearing Defect

* **Exact File Path**: `frontend/user-app/app/(flows)/checkout.tsx`
* **Exact Function/Component**: Checkout payment flow handler
* **Root Cause**: The application triggers a redirect to Stripe's hosted checkout screen but clears the client-side cart state *before* redirecting, instead of waiting for payment validation confirmation.
* **Severity**: HIGH
* **Exploit / Risk**: If a user cancels the payment on Stripe, closes the tab, or suffers a network drop during payment, they return to the app with an empty cart and lose their selection, even though the order remains unpaid (`pending`) on the backend.
* **Exact Fix**:
  Retain items in the cart store during redirect. Only execute `cartStore.clear()` after returning to the application's success screen and successfully executing the payment status check endpoint `/admin-api/v1/payments/stripe/session/:sessionId`.

---

## 5. Redis Heartbeat and PostgreSQL Online Status Desync

* **Exact File Path**: 
  * `backend/src/workers/driverHeartbeat.worker.ts`
  * `backend/src/features/driver/driver.service.ts`
* **Exact Function/Component**: Heartbeat worker process & Redis location tracking
* **Root Cause**: When a driver turns online, the server creates a `driver:online:${driverId}` key in Redis expiring in 30 seconds. If the driver terminates the app or loses signal, the Redis key expires. However, there is no automatic database reconciler executing, leaving `is_online = true` and `state = 'AVAILABLE'` in the Postgres database indefinitely.
* **Severity**: MEDIUM
* **Exploit / Risk**: Disconnected drivers remain eligible for dispatch assignments. The backend routes orders to these ghost drivers, where the offer eventually times out (45 seconds), frustrating users and locking up orders in the dispatch loop.
* **Exact Fix**:
  Ensure that the background worker in `backend/src/workers/driverHeartbeat.worker.ts` is running and checks for drivers whose Redis online keys have expired (or whose database `last_seen_at` is older than 60 seconds), executing `DriverRepository.markDriverOffline(driverId)` to clean up their state.
