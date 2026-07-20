# Exact Fix Plan

This document outlines the priority-ordered action plan to resolve all security, architectural, and performance issues identified in the JAHEEZ system audit.

---

## Priority 0: Critical Bugs & Security Hardening

### 1. Implement Stripe Webhook & Signature Verification
* **Exact File Paths**:
  * [app.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/app.ts)
  * [checkout.routes.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/order/checkout.routes.ts)
  * [checkout.controller.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/order/checkout.controller.ts)
  * [checkout.service.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/order/checkout.service.ts)
* **Root Cause**: The system relies on a client-initiated GET request to verify payments, risking unpaid orders if the client closes the page, and exposing the system to transaction spoofing.
* **Exact Fix**:
  1. **Configure Webhook Router**: Create a dedicated Stripe webhook route in `checkout.routes.ts`:
     ```typescript
     router.post('/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }), controller.handleStripeWebhook);
     ```
     *(Note: This route must use `express.raw` payload parsing to properly construct the webhook event signature).*
  2. **Verify Signature & Transition Order**: In `checkout.service.ts`, implement:
     ```typescript
     async handleWebhookEvent(rawBody: Buffer, signature: string) {
       const stripe = this.getStripe();
       const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

       if (event.type === 'checkout.session.completed') {
         const session = event.data.object as Stripe.Checkout.Session;
         const orderId = session.metadata?.order_id;
         const userId = session.metadata?.user_id;
         const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

         if (orderId && userId) {
           await this.checkoutRepo.markOrderPaid(orderId, userId, paymentIntentId);
           await this.lifecycleService.transitionOrder(
             orderId,
             { type: 'system', id: null },
             'confirmed',
             'Order confirmed via Stripe Webhook'
           );
         }
       }
     }
     ```

### 2. Move Rate Limiter Middleware Before Router Definitions
* **Exact File Path**: [app.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/app.ts)
* **Root Cause**: The `apiLimiter` rate limiter is mounted after all key routers, meaning it is never reached for active API routes.
* **Exact Fix**:
  Move line 40 in `app.ts` (`app.use('/admin-api', apiLimiter);`) to run before the routers are mounted:
  ```typescript
  // 1. Logger & Rate Limiter
  app.use(requestLogger);
  app.use('/admin-api', apiLimiter);

  // 2. Main Routers
  app.use('/admin-api', authRouter);
  app.use('/admin-api', storeRouter);
  // ...
  ```

### 3. Migrate Frontend Direct Supabase Queries to Express MVC
* **Exact File Path**: [addresses.tsx](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/user-app/app/(flows)/addresses.tsx)
* **Root Cause**: Bypasses the unified Express MVC backend layer, querying `user_addresses` directly from the client.
* **Exact Fix**:
  1. **Add GET Endpoints**: Implement address retrieval in `customer.routes.ts` and `customer.controller.ts`:
     ```typescript
     // Controller
     getAddresses = async (req: Request, res: Response, next: NextFunction) => {
       const userId = req.supabaseUser?.id;
       const result = await this.customerService.getAddresses(userId);
       return res.status(200).json(result);
     };
     ```
  2. **Refactor Client**: In `addresses.tsx` line 40, replace the direct Supabase call:
     ```typescript
     // FROM:
     // const { data } = await supabase.from('user_addresses').select('*').eq('user_id', user.id);
     // TO:
     const data = await backendJson<Address[]>('/admin-api/v1/customer/addresses', { method: 'GET' });
     ```

### 4. Correct proxy.js WebSocket Upgrade Handling
* **Exact File Path**: [proxy.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/proxy.js)
* **Root Cause**: HMR upgrade connections `/hot` and `/message` do not match `isAssetLike`, causing driver-app upgrades to default to the user-app Metro port, creating infinite reload loops.
* **Exact Fix**:
  Update lines 287-295 in `scripts/proxy.js` to route upgrades properly using request headers:
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

### 5. Install & Initialize Socket.IO Client in Driver Application
* **Exact File Paths**:
  * `frontend/driver-app/package.json`
  * `frontend/driver-app/features/delivery/views/DriverDashboardScreen.tsx`
* **Root Cause**: The driver app is missing `socket.io-client` and relies on slow 15-second REST polling, leading to dispatch offer timeouts.
* **Exact Fix**:
  1. Add `"socket.io-client": "^4.7.5"` to `package.json`.
  2. Instantiate and listen to events in the driver app:
     ```typescript
     import io from 'socket.io-client';
     
     const socket = io(PROXY_URL, {
       path: '/socket.io',
       auth: { token: driverJwt, actor: 'driver' },
     });
     
     socket.on('order:offered', (data) => {
       // Display full screen offer modal immediately
       setIncomingOffer(data);
     });

     socket.on('order:offer_expired', () => {
       // Auto-dismiss the offer modal
       setIncomingOffer(null);
     });
     ```

---

## Priority 1: Performance Optimizations

### 1. Parallelize/Batch DB operations in Dispatch Matching Loop
* **Exact File Path**: [dispatch.service.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/dispatch/dispatch.service.ts)
* **Root Cause**: Matches are processed sequentially in a loop, triggering multiple DB reads/writes per match.
* **Exact Fix**:
  1. Collect all matched driver IDs.
  2. Batch query all corresponding driver stats in one SELECT statement.
  3. Execute updates in parallel using `Promise.all()`:
     ```typescript
     await Promise.all(matches.map(async (match) => {
       const { orderId, driverId } = match;
       await this.offerQueue.addOffer(orderId, driverId, offerExpiresAt);
       // Recalculate stats & update driver state...
     }));
     ```

### 2. Batch Operations in Timeout Worker
* **Exact File Path**: [timeoutWorker.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/features/dispatch/timeoutWorker.ts)
* **Exact Fix**:
  Replace sequential updates inside the `for (const offer of expiredOffers)` loop with parallelized execution patterns utilizing `Promise.all()`.

---

## Priority 2: Code Hygiene

### 1. Remove Obsolete Monolith Files
* **Action**: Delete `scripts/admin-api.js` and remove references to it in launch configurations inside `package.json`.
