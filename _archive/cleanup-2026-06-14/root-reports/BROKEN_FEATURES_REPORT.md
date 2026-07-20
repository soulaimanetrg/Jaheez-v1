# Broken Features & Flows Report

This document reports functional defects, integration bugs, and synchronization failures identified across the JAHEEZ codebase.

---

## 1. Driver Dashboard & Admin Dashboard Sockets (Missing Socket client)
- **Severity**: CRITICAL
- **Impacted Files**:
  - [DriverDashboardScreen.tsx](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/driver-app/features/delivery/views/DriverDashboardScreen.tsx#L58) (No Socket.IO initialization)
  - [package.json](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/driver-app/package.json) (Missing `socket.io-client` package)
  - [package.json](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/package.json) (Missing `socket.io-client` package)
- **Why it breaks**: The Express backend dispatch matching engine (`DispatchService`) and timeout workers broadcast order matches (`order:offered` event) and expirations (`order:offer_expired` event) over Socket.IO. However, the driver-app and admin panel do not install `socket.io-client` and do not establish a WebSocket connection. Instead, the driver app polls the `/driver/orders?scope=available` REST endpoint every 15 seconds. Since backend driver offers expire in 45 seconds, a driver polling every 15 seconds will receive notifications with massive delays, causing many offers to time out before the driver can click "Accept", leading to excessive auto-bans.
- **Reproduction Steps**:
  1. Place an order on the user-app.
  2. Launch the driver-app and switch status to Online.
  3. Observe that the driver does not receive an instantaneous fullscreen order offer modal. Instead, it must wait up to 15 seconds for the next poll cycle to trigger the countdown modal, leaving very little time to respond before expiration.
- **Safe Backend-Authoritative Fix**:
  1. Add `socket.io-client` to the dependencies of `frontend/driver-app` and `frontend/admin`.
  2. Initialize the WebSocket client on driver authentication. Pass the JWT and the actor header (`actor: 'driver'`) in the connection payload.
  3. Join the room `driver:${driverId}` upon connection.
  4. Listen to `order:offered` and `order:offer_expired` events to display and dismiss the offer modal in real time.

---

## 2. Metro HMR WebSocket Routing Conflict (Apps keep refreshing)
- **Severity**: HIGH
- **Impacted Files**:
  - [proxy.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/proxy.js#L287)
- **Why it breaks**: When running both frontend apps, the developer proxy (`proxy.js`) processes WebSocket upgrade requests for HMR `/hot` and `/message`. The proxy uses `isDriverAssetByContext` to determine if a WebSocket upgrade request belongs to the driver app. However, `/hot` and `/message` do not match `isAssetLike` (which only checks for `/node_modules/`, `/assets/`, etc.). As a result, WebSocket upgrades from the driver app default to `METRO_PORT` (8081 - user app). The user app's Metro server receives a connection from a driver-app context, causing Fast Refresh to fail and trigger a full browser reload in a loop.
- **Reproduction Steps**:
  1. Start both Metro servers (user-app on 8081, driver-app on 8082).
  2. Start the proxy script on port 5000.
  3. Open `http://localhost:5000/` and `http://localhost:5000/driver/` in separate browser tabs.
  4. Note that both tabs constantly reload/refresh.
- **Safe Backend-Authoritative Fix**:
  Update `proxy.js` to correctly route WebSocket upgrades for HMR by checking the `Referer` header:
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
      ref.includes('/driver')
    ) {
      targetPort = DRIVER_PORT;
    }
    // ...
  ```

---

## 3. Web Client Stripe Redirect Failure (Desync Risk)
- **Severity**: HIGH
- **Impacted Files**:
  - [checkout.tsx](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/user-app/app/(flows)/checkout.tsx#L173)
- **Why it breaks**: If the customer completes a card checkout, the app calls `payWithStripe(session.data.url)`. On the Web platform, this redirects the current window to Stripe checkout. Because the cart is cleared immediately *before* redirecting, if the customer cancels the payment, closes the tab, or fails the checkout on Stripe, they return to an empty cart and lose their selection.
- **Reproduction Steps**:
  1. Add items to the cart and proceed to Checkout.
  2. Select Credit Card and click "Place Order".
  3. On the Stripe payment page, click "Cancel" to return to the app.
  4. Note that your cart is now empty, and the order is stuck in "pending" status.
- **Safe Backend-Authoritative Fix**:
  Do not clear the cart until payment completion is verified.
  1. Store the active checkout `order_id` in local state.
  2. Redirect to Stripe.
  3. Upon returning, check the payment status against `/admin-api/v1/payments/stripe/session/:sessionId`.
  4. Clear the cart only after receiving confirmation that the order status has successfully changed to `confirmed`.

---

## 4. Telemetry Heartbeat & Offline Driver State Desync
- **Severity**: MEDIUM
- **Impacted Files**:
  - [driver.service.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/driver/driver.service.ts#L207)
  - [driverHeartbeat.worker.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/workers/driverHeartbeat.worker.ts)
- **Why it breaks**: When a driver goes online, a Redis key `driver:online:${driverId}` is created with a 30-second expiration. However, if the driver app goes to the background or loses connection and stops sending heartbeats, the Redis key expires. The Postgres database status (`is_online`) remains `true` in the database, causing a desync where the dashboard shows the driver as "Online" but they are not dispatchable.
- **Reproduction Steps**:
  1. Log in as a driver, go Online.
  2. Force-close the driver app or disconnect the network.
  3. Observe that the driver remains in "Online" status in the Admin dashboard long after the 30-second heartbeat window has passed.
- **Safe Backend-Authoritative Fix**:
  The `driverHeartbeat.worker.ts` must periodically scan for drivers whose Redis heartbeat has expired (or whose `last_seen_at` is older than 60 seconds) and update their database `is_online` status to `false` and state to `OFFLINE`.
