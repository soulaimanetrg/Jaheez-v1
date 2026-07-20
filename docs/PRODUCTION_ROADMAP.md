# JAHEEZ (جاهز) — PRODUCTION ROADMAP
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Approved Roadmap

---

## 1. PRIORITY LEVELS

### P0: Critical Security & Scope Cleanup (Day 1-2)
* **Goal:** Close financial fraud loops and remove simulated mock views.
* **Tasks:**
  1. Revoke direct write access permissions to `orders` table. Create an Express backend endpoint `/api/checkout` to process payments and insert order details securely.
  2. Drop the update policy on `orders` to prevent customers from self-approving order statuses.
  3. Delete `ai-suggestion.tsx`, `vehicle-types.tsx`, and `fallbackApi.ts` from the project.
  4. Ensure server processes crash if `ADMIN_JWT_SECRET` is not set in production.

---

### P1: Core Logistics & Integration Blockers (Day 3-5)
* **Goal:** Implement real tracking, geofencing, and payment webhooks.
* **Tasks:**
  1. Replace the mock tracking grid with Google Maps API.
  2. Implement background GPS streaming on the driver side.
  3. Build geolocation verification verifying driver coordinates match the store/customer location before allowing status updates.
  4. Finalize the Stripe webhook handler to update order states asynchronously.

---

### P2: Performance & Scaling Optimizations (Day 6-7)
* **Goal:** Improve performance and responsiveness on low-end Android devices.
* **Tasks:**
  1. Migrate product catalog lists to Shopify's `FlashList`.
  2. Compress all images in assets directories to under 200KB.
  3. Create lookup indexes on tables in Supabase (`orders`, `menu_items`).

---

### P3: Monitoring & DevOps Strategy (Post-Launch)
* **Goal:** Ensure backend observability.
* **Tasks:**
  1. Set up Winston logging on the Express backend server.
  2. Move keys and secrets from `.env` files to EAS secrets configuration.
  3. Configure PM2 for process management and automatic restarts.
