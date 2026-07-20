# 18. Execution Roadmap

This document maps out the phases to stabilize the JAHEEZ platform for production.

---

## 1. Roadmap Phases

### Phase 0: Make Restructured Backend Runnable (P0)
1.  **Resolve Port Conflict**: Update restructured backend configuration to default to Port 3002.
2.  **Configure API Proxy**: Modify `scripts/proxy.js` to route all REST API endpoints (e.g. `/admin-api/v1/*`, `/admin-api/driver/*`) to Port 3002 (the restructured backend), leaving only legacy-only administrative routes on Port 3001 temporarily.
3.  **Validate Backend Dev Server**: Verify that the new backend boots successfully and receives proxied HTTP traffic.

### Phase 1: Database Table and Schema Consolidation (P0)
4.  **Sync Local DB Tables to Supabase**: Create `promotions`, `banners`, and `admin_login_attempts` tables on Supabase matching the monolith schema. Enable RLS and migrate existing records.
5.  **Fix Review Table Reference**: Update `customer.repository.ts` to insert reviews into `store_reviews` instead of `reviews`.
6.  **Migrate Monolith Admin Routes**: decalrate routes for promotions, banners, and settings in the restructured backend and deprecate the local PostgreSQL database pool.

### Phase 2: Payment & Authentication Hardening (P0)
7.  **Disable Monolith Stripe Bypass**: Set `LEGACY_STRIPE_ROUTES_ENABLED = false` in `.env` and delete legacy checkout endpoints in `scripts/admin-api.js` to eliminate price-tampering bypass.
8.  **Stripe Webhook Signatures**: Implement webhook signature verification in backend payment handlers to prevent spoofing.
9.  **Remove Hardcoded Fallback Credentials**: Remove fallback check routines in monolith auth and fail closed on database connection timeouts.

### Phase 3: Telemetry & Driver Heartbeat Implementation (P0)
10. **Implement Geolocation in Driver App**: Add periodic location acquisition in `driver-app` using `expo-location` and transmit coordinates to the server.
11. **Route Location updates to Restructured Backend**: Ensure location updates patch to restructured Port 3002 so they populate Redis geo indices.
12. **Verify Stale Cleanup Worker**: Confirm that the backend heartbeat worker periodically marks offline drivers with expired Redis TTLs.

### Phase 4: Socket.IO Realtime Migration (P0)
13. **Install Socket.IO Client**: Add `socket.io-client` dependency and connection logic to both mobile applications.
14. **Transition to Socket Rooms**: Replace direct client-to-Supabase Realtime subscriptions with JWT-secured Socket.IO room events (`order:{id}`, `driver:{id}`).
15. **Establish Admin Realtime Dashboard**: Route live driver coordinates from Redis locations to the admin dashboard via Socket.IO broadcasts.

### Phase 5: Production Deployment & Smoke Testing (P1)
16. **Build Mobile APKs**: Compile release builds for the User and Driver mobile apps.
17. **Production Deployments**: Deploy the backend and databases to production environments (Supabase, Redis Cloud, hosting services).
18. **Platform Verification**: Perform end-to-end integration and smoke tests.

