# 16. Security Hardening Plan

This document maps out specific tasks to resolve security vulnerabilities.

---

## 1. Action Items

### Phase 1: Authentication & Authorization (P0)
*   **Item 01: Remove Mock Admin Fallback**
    *   *Task*: Delete fallback check blocks from login controllers that allow bypass when PG connection times out.
    *   *Files*: `scripts/admin-api.js` line 362.
*   **Item 02: Implement Redis OTP Cache**
    *   *Task*: Replace local process-memory validation cache maps in the monolith with Redis keys featuring a 5-minute TTL.
    *   *Files*: `scripts/admin-api.js` and `backend/src/services/auth.service.ts`

### Phase 2: Input Validation, Checkout & Stripe Security (P0)
*   **Item 03: Disable Legacy Stripe Bypass Route**
    *   *Task*: Set `LEGACY_STRIPE_ROUTES_ENABLED = false` in the environment configuration and remove Stripe session creation from `admin-api.js`.
    *   *Files*: `scripts/admin-api.js` lines 3000-3055.
*   **Item 04: Implement Idempotency Check in Checkout**
    *   *Task*: Create `idempotency_keys` table on Supabase (using a migration script) to allow the new backend checkout repository to safely save and query idempotency keys.
    *   *Files*: `backend/src/repositories/checkout.repository.ts` line 44, 62.

### Phase 3: Row-Level Security & Table Setup (P0)
*   **Item 05: Recreate and Migrate Missing Tables to Supabase**
    *   *Task*: Write and apply SQL migrations to create `promotions`, `admin_login_attempts`, and `idempotency_keys` tables directly on Supabase so that all backend repository calls function without local Postgres desyncs.
    *   *Files*: `supabase_schema.sql` (append migrations).
*   **Item 06: Harden Row-Level Security Rules**
    *   *Task*: Lock down `wallets`, `wallet_transactions`, `orders`, `order_items`, and `store_reviews` so that direct client-side insertions are disabled. Force all database mutations to go through backend service-role API routes.
    *   *Files*: `supabase_schema.sql` (RLS definitions).

### Phase 4: Realtime & Traffic Management (P1)
*   **Item 07: Apply Global Rate Limiting**
    *   *Task*: Position the Express rate limiter middleware before router mounting blocks on the new backend.
    *   *Files*: `backend/src/app.ts`
*   **Item 08: Socket.IO Authentication & Room Checks**
    *   *Task*: Verify JWT signature headers on all Socket.IO connections and enforce driver/customer room boundaries (`order:{id}`).
    *   *Files*: `backend/src/realtime/socket.server.ts`
