# 06. Frontend API and DB Write Audit

This document lists all database accesses and client-side concerns found in the frontend applications.

---

## 1. Direct Supabase Client Mutations (Writes)

*   **Status**: **RESOLVED** on the database table level. Code audit confirms that both `user-app` and `driver-app` have been refactored to remove direct `.insert()`, `.update()`, or `.delete()` calls to PostgreSQL tables. All data modifications are routed via HTTP REST calls to `/admin-api/v1/customer/...` or `/admin-api/driver/...`.
*   **Storage Uploads**:
    *   **File**: `driver-app/app/(tabs)/profile.tsx` line 80
    *   **Action**: Directly uploads driver KYC images to Supabase storage buckets (`supabase.storage.from(...)`). This is acceptable for files, but the resulting URLs are submitted back to the API.

---

## 2. Direct Supabase Client Queries (Reads)

While write operations have been moved to the REST API, both mobile applications still query the database directly for reads. This exposes database credentials and bypasses API-level caching and business logic:

### Read 01: Wallet Balance & Ledger Queries
*   **File**: `user-app/lib/walletApi.ts` lines 38-42 and 55-60
*   **Action**: Selects directly from `wallets` and `wallet_transactions` tables.

### Read 02: Support Request History
*   **File**: `user-app/lib/supportApi.ts` lines 44-50
*   **Action**: Selects directly from the `support_requests` table.

### Read 03: Order Listing & Details
*   **File**: `user-app/lib/orderApi.ts` lines 19-30 and 41-53
*   **Action**: Selects directly from `orders`, `stores`, `order_items`, `menu_items`, and `drivers` tables.

### Read 04: Store Catalog & Reviews
*   **File**: `user-app/lib/storeApi.ts` lines 207-212 and 242-247
*   **Action**: Selects directly from `menu_categories`, `menu_items`, and `store_reviews`.

### Read 05: Favorite Stores
*   **File**: `user-app/lib/storeApi.ts` lines 265-270 and 284-289
*   **Action**: Selects directly from the `favorites` table.

### Read 06: Active Chat Messages
*   **File**: `user-app/app/(flows)/chat/[id].tsx` lines 43-47
*   **Action**: Selects directly from the `chat_messages` table.

---

## 3. Client-Side Calculations & stripe checkout Session
*   **File**: `user-app/app/(flows)/checkout.tsx`
*   **Description**: Calculates subtotals, applies promo code reductions, adds delivery fees, and computes the final total.
*   **Stripe Session Integration**:
    *   **Secure Path**: The mobile app `stripeClient.ts` calls `/admin-api/v1/payments/stripe/checkout-session`, passing only the `order_id`. The restructured backend fetches the order details from the database and uses the server-side total, which is secure.
    *   **Legacy Bypass Path**: If `LEGACY_STRIPE_ROUTES_ENABLED === 'true'` on the monolith, the old endpoint `/admin-api/stripe/checkout-session` accepts client-side `amount_centimes` directly. This permits a malicious client to modify payment amount values.

