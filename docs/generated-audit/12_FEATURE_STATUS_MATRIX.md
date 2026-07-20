# 12. Feature Status Matrix

This document lists features and their current development status.

---

## 1. Customer App (`user-app/`)

| Feature | Status | Evidence File | Risk / Issue | Required Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Splash Init** | **WORKING** | `app/splash.tsx` | Minimal. | Keep. |
| **Login / Register** | **WORKING** | `app/login.tsx` | Fallback phone logic is weak. | Transition registration to backend endpoints. |
| **Store Browsing** | **WORKING** | `app/store/[id].tsx` | None. | Keep. |
| **Cart Operations** | **WORKING** | `app/cart.tsx` | None. | Keep. |
| **Checkout & Stripe** | **WORKING (SECURE MVC) / BYPASS RISK** | `app/checkout.tsx`, `stripeClient.ts` | Stripe Session amount tampering bypass exists on monolith port 3001. | Set `LEGACY_STRIPE_ROUTES_ENABLED = false` and delete monolith routes. |
| **Order Tracking** | **WORKING (UNSECURE)** | `app/tracking/[id].tsx`, `lib/orderApi.ts` | Uses direct Supabase Realtime WAL subscriptions. | Transition to Socket.IO. |
| **Chat Thread** | **WORKING (UNSECURE)** | `app/(flows)/chat/[id].tsx` | Reads direct from Supabase, updates via REST. | Move reads to REST and migrate to Socket.IO. |

---

## 2. Driver App (`driver-app/`)

| Feature | Status | Evidence File | Risk / Issue | Required Fix |
| :--- | :--- | :--- | :--- | :--- |
| **OTP Auth** | **WORKING (LEGACY)** | `lib/api.ts`, `admin-api.js` | OTP codes are stored in Express server memory. | Move OTP cache to Redis. |
| **Location Updates** | **FAKE / NOT CONNECTED** | `app/(tabs)/index.tsx` | Driver-app lacks GPS watch or heartbeat polling code. | Implement background geolocation service using `expo-location`. |
| **Order Claim & Acceptance** | **WORKING (LEGACY)** | `lib/api.ts`, `admin-api.js` line 2669 | Legacy monolith checks driver assignment correctly. | Port claim endpoint logic to Restructured Backend. |
| **Document Upload** | **WORKING (LEGACY)** | `app/(tabs)/profile.tsx` | Uploads directly to Supabase storage. | Route storage uploads through backend or pre-signed URLs. |
| **Payout Requests** | **WORKING (LEGACY)** | `lib/api.ts`, `admin-api.js` | Uses commission structure rather than hourly salary. | Adjust payouts logic to respect hourly salary. |

---

## 3. Admin Panel (`admin/`)

| Feature | Status | Evidence File | Risk / Issue | Required Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | **WORKING / RISKY** | `src/pages/login.tsx` | Fallback credentials (`admin@jaheez.ma`) bypass DB check. | Remove hardcoded admin account from monolith. |
| **Dashboard KPIs** | **WORKING (LEGACY)** | `src/pages/Dashboard.tsx` | Loads via legacy monolith. | Move queries to restructured MVC backend. |
| **Zones Config** | **WORKING (LEGACY)** | `src/pages/zones.tsx` | Flat-fee neighborhoods only. | Move zone validation to restructured MVC backend. |
| **Wallet Adjustments** | **WORKING (LEGACY)** | `src/pages/wallets.tsx`, `src/lib/api.ts` line 333 | Admin panel has a complete wallet adjustment UI. | Move adjustments to restructured MVC backend. |
| **Refunds** | **WORKING (LEGACY)** | `src/pages/refunds.tsx` | Admin panel has a complete refund issuance page. | Move refunds logic to restructured MVC backend. |
| **Promotions** | **WORKING (LEGACY) / CRASH RISK** | `src/pages/promotions.tsx` | promotions table does not exist on Supabase. | Sync local promotions table to Supabase. |
| **Admins catalog** | **WORKING (LEGACY)** | `src/pages/admins.tsx` | admins table contains password hashes in DB. | Restrict hash returns. |

