# 17. MVC Refactor Plan

This document details steps to refactor the application layers to match the target MVC architecture.

---

## 1. Refactoring Steps

### Step 01: Migrate and Recreate Missing Tables on Supabase
*   **Target File**: `supabase_schema.sql` (migrations script)
*   **Changes**: Create migrations defining the missing tables `promotions`, `admin_login_attempts`, and `idempotency_keys` directly on Supabase.
*   **Test**: Run the database migrations in the Supabase SQL Editor and verify that queries to these tables succeed without errors. Ensure `customer.repository.ts` line 156 is updated to query `store_reviews` instead of `reviews`.

### Step 02: Migrate Monolith Admin Routes
*   **Target Files**: `scripts/admin-api.js` (extract routes) -> `backend/src/routes/admin.ts`
*   **Changes**: Move legacy admin endpoints into the MVC directory, decoupling DB operations into Services and Repositories.
*   **Test**: Run the MVC backend and verify admin authentication and analytics load correctly.

### Step 03: Establish Unified Backend Port
*   **Target Files**: `scripts/proxy.js`, `backend/src/config/env.ts`
*   **Changes**: Set the MVC backend Port to `3001` (replacing the legacy monolith). Remove the reverse proxy script.
*   **Test**: Update frontend clients to point directly to Port 3001 and verify all operational endpoints route correctly.

### Step 04: Remove Direct Database Writes
*   **Target Files**: `user-app/lib/orderApi.ts`, `user-app/app/(flows)/addresses.tsx`
*   **Changes**: Implement backend REST endpoints for addresses, custom requests, and favorites. Modify frontend clients to call the REST API.
*   **Test**: Verify that direct inserts from unauthorized Supabase clients return permission errors.
