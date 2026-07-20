# JAHEEZ (جاهز) — CURRENT STATE AUDIT
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Early Prototype / Pre-Beta

---

## 1. WHAT WORKS (VERIFIED IN CODE)

* **Cross-App Shared Type Declarations:** [shared/types.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/shared/types.ts) and [shared/constants.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/shared/constants.ts) correctly share enums, statuses, and type constraints across nodes.
* **Basic User Authentication (Email/Password):** Client logins via [authApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/authApi.ts) calling `supabase.auth.signInWithPassword` verify credentials.
* **Store & Product Catalog Exploration:** User-app can fetch and render list arrays of categories, partner stores, and items.
* **Client-Side Cart Operations:** [cartStore.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/store/cartStore.ts) Zustand hooks correctly add, remove, and update menu item quantities and subtotals.
* **Static Admin Impersonation Bypass:** Basic super admin credentials verification falls back to the hardcoded `admin@jaheez.ma` account when the PostgreSQL DB is unreachable.

---

## 2. WHAT PARTIALLY WORKS (HARDENING REQUIRED)

* **SMS OTP flow:** Code in [infobipOtp.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/infobipOtp.ts) contains fetch scaffolding for the Infobip API, but returns uncaught errors if keys are empty in `.env`.
* **Driver Active Delivery Flow:** Statuses transition correctly in driver stores, but lack device hardware location updates and connection-loss resiliency.
* **Admin Dashboard Moderation:** Admins can toggle verification switches for stores and drivers, but updates bypass transactional audit logging.

---

## 3. WHAT IS FAKE (MOCKED OR SIMULATED)

* **Customer Real-time Tracking Map:** [tracking/[id].tsx](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/app/%28flows%29/tracking/%5Bid%5D.tsx) uses absolute positioned borders to draw a grid and uses static emojis (🛵) instead of an active Google Maps API.
* **AI Suggestion System:** [ai-suggestion.tsx](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/app/%28flows%29/ai-suggestion.tsx) uses preset lists and a `setInterval` timer loop to simulate "thinking" states.
* **OSM Overpass & MealDB Fallbacks:** [fallbackApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/fallbackApi.ts) contains Overpass and MealDB connections to generate random store lists and recipes when the Supabase database is unpopulated.
* **Admin Analytics & Charts:** charts in [analytics.tsx](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/admin/src/pages/analytics.tsx) render hardcoded datasets.
* **Driver GPS Location Streaming:** Driver locations are simulated using path matrices instead of background location tracking.

---

## 4. WHAT CRASHES (STABILITY RISK)

* **Expo App Hydration:** App loading crashes on start if the `.env` configuration contains old/empty Supabase references because the cache isn't cleared.
* **Android Low-Memory Crashes:** The presence of large uncompressed images (>1.5MB) in raw assets crashes low-end Android devices due to out-of-memory errors.

---

## 5. WHAT IS MISSING (ESSENTIAL FOR LAUNCH)

* **Secure Checkout Route:** Orders must be created securely via the backend API instead of using direct client Supabase insert permissions (security risk).
* **Merchant Interface:** No interface exists in the codebase for merchants to receive, accept, and update order statuses.
* **Geofence Verification:** Verification preventing drivers from updating statuses (e.g. `picked_up` or `delivered`) when they are not physically at the store/customer location.

---

## 6. WHAT SHOULD BE DELETED (SCOPE REDUCTION)

* `user-app/app/(flows)/ai-suggestion.tsx` (Mock AI screen)
* `admin/src/pages/vehicle-types.tsx` (Violates motorcycle-only rule)
* `user-app/lib/fallbackApi.ts` (MealDB/Overpass API fallbacks)
* Unused packages in `package.json` files.
