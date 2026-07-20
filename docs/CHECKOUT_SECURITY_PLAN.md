# CHECKOUT SECURITY PLAN

This document outlines the security architecture for the checkout flow of **JAHEEZ ( جاهز )**, ensuring that the backend server is the single source of truth for pricing, fees, and state transitions, and that direct client-side database mutations are eliminated.

---

## 1. Threat Model & Vulnerabilities

In the legacy design, the client applications (User App) had direct write access to the Supabase database. This led to several critical security risks:
1. **Price Tampering:** Clients could insert orders with arbitrary values for `subtotal`, `delivery_fee`, and `total_amount`.
2. **Payment Bypass:** Clients could insert orders with `payment_status = 'paid'` without completing any financial transaction.
3. **Orphaned Entities:** Orders and order items were inserted in separate, non-atomic client-side queries. If the second query failed, it resulted in empty order headers.
4. **State Machine Bypass:** Clients could run updates on the `orders` table directly, allowing users to transition order statuses (e.g., marking their own orders as `delivered` or `completed` to avoid payment in Cash on Delivery).
5. **Wallet Manipulation:** Clients could directly update wallets or insert wallet transactions to inflate balances.

---

## 2. Server-Authoritative Architecture

Under the new architecture, the Express backend API (`admin-api`) is the sole entity allowed to mutate orders, order items, wallets, and wallet transactions. Row Level Security (RLS) is enabled on all tables in Supabase to restrict direct client access to read-only queries (SELECT) on their own data.

```
[User / Driver Mobile Client]
         │
         │  (HTTPS POST /admin-api/v1/checkout)
         ▼
┌────────────────────────────────────────────────────────┐
│               Express admin-api Backend                │
│  1. Extract & verify User Supabase JWT                 │
│  2. Validate payload schema with Zod                   │
│  3. Check Idempotency Key in Redis/DB                  │
│  4. Fetch Store and official Menu Item prices from DB   │
│  5. Calculate totals (subtotal, delivery fee, total)   │
│  6. Validate store coordinates & delivery radius       │
│  7. Verify wallet balance if payment_method = 'wallet' │
│  8. Execute atomic DB Transaction:                     │
│     - Insert order                                     │
│     - Insert order_items                               │
│     - Deduct wallet (if applicable)                    │
│     - Insert audit trail & idempotency log             │
└────────────────────────────────────────────────────────┘
```

---

## 3. Checkout Validation Pipeline

The checkout endpoint (`POST /admin-api/v1/checkout`) runs the following verification steps:

1. **Authentication Verification:**
   - Extract the Bearer token from the `Authorization` header.
   - Verify the token against Supabase Auth service (`sb.auth.getUser()`) to ensure the user is logged in and active.
   
2. **Input Validation (Zod Schema):**
   - Verify payload types for item IDs, quantities, coordinates, phone formats, and addresses.
   
3. **Idempotency Check:**
   - Read the unique `idempotency_key` from the request headers or body.
   - Check if an order with this key was already successfully processed. If so, return the existing order details immediately.

4. **Store Availability & Verification:**
   - Query the `stores` table using `service_role`.
   - Ensure the store exists, is active (`is_active = true`), and open (`is_open = true`).

5. **Menu Item Pricing & Stock Check:**
   - Fetch the menu items listed in the cart directly from the `menu_items` table.
   - Verify that all items exist, belong to the target store, and are available (`is_available = true`).
   - Use the official database `price` for calculation. (Discard any pricing details sent in the client payload).

6. **Delivery Radius & Fee Calculation:**
   - Verify dropoff coordinates are valid.
   - Calculate distance between store (`lat`, `lng`) and dropoff (`delivery_lat`, `delivery_lng`) using the Haversine formula.
   - If distance exceeds the maximum allowed motorcycle delivery radius in Safi (e.g., 15km), reject the order.
   - Apply the official `delivery_fee` registered for the store.

7. **Financial Verification & Totals Calculation:**
   - Calculate `subtotal = SUM(db_price * quantity)`.
   - Apply promotional discount if a valid `promo_code` is provided (validate against `promotions` table).
   - Calculate `total_amount = subtotal + delivery_fee - discount`.
   - If payment method is `wallet`, fetch user's wallet, verify `balance_centimes >= total_amount * 100`, and prepare atomic deduction.
   - For COD (Cash on Delivery), verify eligibility (e.g., user is not banned, order total does not exceed COD limits).

8. **Database Transaction Safety:**
   - Open a Postgres transaction using the database pool.
   - Insert the order details (generating a secure `reference_code` or using the auto-generated UUID).
   - Insert all order items linked to the order.
   - Deduct wallet balance and write the transaction log (if wallet payment).
   - Log the action in the `admin_audit_log` or general `order_status_log`.
   - Commit the transaction. If any query fails, rollback the transaction completely to avoid partial writes.
