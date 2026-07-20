# 08. Database and RLS Audit

This document audits the database schemas, triggers, functions, and Row-Level Security (RLS) policies.

---

## 1. Database Topology

The database setup uses a split-model layout:
*   **Supabase PostgreSQL (Cloud)**: Holds the primary shared entities: `users`, `drivers`, `orders`, `order_items`, `wallets`, `wallet_transactions`, `stores`, `menu_items`, `menu_categories`.
*   **Local PostgreSQL**: Created and used by the legacy monolith `scripts/admin-api.js` for admin-only entities: `admins`, `admin_login_attempts`, `promotions`, `push_tokens`, `banners`, `delivery_zones`, `audit_log`, `cities`, `refunds`.

---

## 2. Table Desync Gaps

A critical desync exists between the new restructured backend (`backend/src`) database expectations and the active Supabase schema (`supabase_schema.sql`):

1.  **Missing promotions Table on Supabase**:
    *   *Reference*: `checkout.repository.ts` line 111 queries `.from('promotions')` on Supabase.
    *   *Current State*: Table only exists on the local PostgreSQL database (created by `admin-api.js` line 767). It is missing on Supabase, meaning the new backend checkout service will crash on promo code use.
2.  **Missing admin_login_attempts Table on Supabase**:
    *   *Reference*: `auth.repository.ts` line 53 inserts into `admin_login_attempts` via Supabase client.
    *   *Current State*: Table only exists on local PostgreSQL (created by `admin-api.js` line 231). The new backend will crash on admin login.
3.  **reviews vs store_reviews Mismatch**:
    *   *Reference*: `customer.repository.ts` line 156 inserts into `.from('reviews')` on Supabase.
    *   *Current State*: The table on Supabase is actually named `store_reviews` (`supabase_schema.sql` line 169). The repository insertion will crash.

---

## 3. Row-Level Security (RLS) Status

Row-Level Security is active on Supabase, but policies and client read practices introduce risks:

| Table Name | RLS Status | Customer Policy | Driver Policy | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `orders` | **PARTIALLY HARDENED** | Read-only access to own orders. | Read/Write access to assigned orders. | Safe on writes (API-bound), but direct client reads bypass the backend. |
| `wallets` | **HARDENED** | Read-only. | Read-only. | Safe. Mutations require RPC calls. |
| `user_addresses` | **UNSAFE** | Direct SELECT allowed. | None. | Direct client reads bypass API filters. |
| `favorites` | **UNSAFE** | Direct SELECT allowed. | None. | Direct client reads bypass API filters. |
| `chat_messages` | **UNSAFE** | Direct SELECT allowed. | Direct SELECT allowed. | Direct client reads bypass API filters. |
| `drivers` | **PARTIALLY HARDENED** | Read-only. | Read/Update (own profile). | Safe on writes, but location tracking updates hit the legacy backend. |

---

## 4. Migration & Integrity Risks

*   **RLS Overrides**: The legacy monolith uses the Supabase `service_role` key, bypassing all database RLS rules. Any vulnerability in monolith routes exposes the entire database.
*   **Database Splits**: Hosting some tables (`promotions`, `banners`, `refunds`) on local PG and others on Supabase prevents atomic foreign key constraints (e.g. referencing a store or order on local tables).
