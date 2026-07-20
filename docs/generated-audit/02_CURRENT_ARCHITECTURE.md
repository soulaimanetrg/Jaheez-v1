# 02. Current Architecture

This document maps the actual state of the JAHEEZ repository based on code inspection.

---

## 1. Actual System Topology

```
+---------------------------------------------------------------------------------+
|                                 FRONTEND / UI                                   |
|                                                                                 |
|  +--------------------+      +--------------------+      +-------------------+  |
|  |     User App       |      |     Driver App     |      |    Admin Panel    |  |
|  |   (Expo/React)     |      |   (Expo/React)     |      |   (Vite/React)    |  |
|  +---------+----------+      +---------+----------+      +---------+---------+  |
+------------|---------------------------|---------------------------|------------+
             |                           |                           |             
             | HTTP (Port 5000)          | HTTP (Port 5000)          | HTTP (Port 5000)
             v                           v                           v             
+---------------------------------------------------------------------------------+
|                             COMMUNICATION / PROXY                               |
|                                                                                 |
|  [scripts/proxy.js] (Vanilla Node HTTP Proxy on Port 5000)                      |
|    - Path: /admin-api/*  --> Routes ALL REST API traffic to Port 3001           |
|    - Path: /admin        --> Routes to Vite Admin Panel (Port 3000)             |
|    - Path: /driver       --> Routes to Driver Metro bundle (Port 8000)          |
|    - Other paths         --> Routes to User Metro bundle (Port 8081)            |
+----------------------------------------+----------------------------------------+
                                         |                                         
                                         | Port 3001 (Port Conflict Area)
                                         v                                         
+---------------------------------------------------------------------------------+
|                                 BACKEND APIS                                    |
|                                                                                 |
|  +-------------------------------------+      +------------------------------+  |
|  |           Legacy Monolith           |      |     Restructured Backend     |  |
|  |        (scripts/admin-api.js)       |      |         (backend/src/)       |  |
|  |        Runs on Port 3001            |      |      Compiles, Defaults 3001 |  |
|  +------------------+------------------+      +--------------+---------------+  |
|                     |                                        |                  |
|                     | PostgreSQL Pool                        | Supabase Client  |
|                     v                                        v                  |
+---------------------+----------------------------------------+------------------+
|                                 DATA & CACHE                                    |
|                                                                                 |
|  +-------------------------------------+      +------------------------------+  |
|  |        Supabase PostgreSQL          |      |            Redis             |  |
|  |  (Shared entities, Orders, Auth)    |      | (Driver telemetry, locations)|  |
|  +-------------------+-----------------+      +--------------+---------------+  |
|                      |                                       |                  |
|                      | Raw SQL queries                       | GEORADIUS/GEOADD |
|                      v                                       v                  |
|  +-------------------------------------+                     |                  |
|  |        Local PostgreSQL DB          |                     |                  |
|  | (Banners, Promos, Admin Lockouts)   | <-------------------+                  |
+---------------------------------------------------------------------------------+
```

---

## 2. Component Audits

### Frontend / UI Layer
*   **User App (`user-app/`)**: Built using Expo SDK 55. Implements AsyncStorage for tokens. Direct database writes (inserts/updates/deletes) have been removed and routed through the REST API. However, **direct database reads** still occur via the Supabase client (`user-app/lib/supabase.ts`) for wallets, favorites, chat, and order listings. Passes Stripe checkout metadata client-side, but the payment amount calculation is backend-authoritative.
*   **Driver App (`driver-app/`)**: Built using Expo SDK 55. Relies on HTTP endpoints (`driver-app/lib/api.ts`). **Lacks any location-watching or heartbeat polling code**. KYC documents are uploaded directly to the Supabase Storage bucket, then registered via REST.
*   **Admin Panel (`admin/`)**: Built using Vite + React. Calls `/admin-api/*` endpoints through Port 5000 (proxied to 3001). Features complete interfaces for stores, products, promotions, cities, wallets (adjust/freeze), and refunds.

### Communication & Middleware
*   **Proxy (`scripts/proxy.js`)**: A vanilla Node `http` proxy running on Port 5000. It routes all `/admin-api/*` traffic directly to Port 3001. It has **no configuration routing to the restructured backend**, leaving it completely unrouted.
*   **JWT Security**: Separate token contexts are verified on the backend for admins, drivers, and users. However, if `LEGACY_STRIPE_ROUTES_ENABLED === 'true'`, the monolith exposes a critical price-tampering risk.

### Restructured Backend (`backend/`)
*   Follows the strict MVC flow: `Routes` → `Controllers` → `Services` → `Repositories`.
*   **Current State**: **COMPILES SUCCESSFULLY** (tsc exits with 0). However, it runs on Port 3001 by default, causing a startup conflict with the monolith. It is currently unrouted during local dev tests because of the proxy configuration.
*   **Table Mismatches**: Queries three local-only PostgreSQL tables (`promotions`, `banners`, `admin_login_attempts`) and `reviews` (should be `store_reviews`) from Supabase, which will crash at runtime.

### Legacy Monolith (`scripts/admin-api.js`)
*   An Express application running on Port 3001. It handles all production REST endpoints, routing SQL queries to a local PostgreSQL database for admin-specific functions, and utilizing a service_role Supabase client to bypass RLS for shared tables.

### Telemetry & Realtime
*   **Redis**: Restructured backend contains full location caching and TTL heartbeat logic. However, since the driver app patches `/driver/me` to the legacy monolith on Port 3001 (which lacks Redis integration), the Redis location index remains empty.
*   **Socket.IO**: Mounted on port 3001/3002 in the restructured backend server with JWT verification and room logic. However, neither `user-app` nor `driver-app` has `socket.io-client` installed or configured; they rely entirely on direct Supabase Realtime PostgreSQL WAL subscriptions.

