# JAHEEZ (جاهز) — DATABASE & SUPABASE AUDIT
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Medium Risk — Indexing & Policy Security Hardening Needed

---

## 1. SCHEMA ANALYSIS & INDEXING DEFICITS

### Lookups and Sequential Scans
* **Issue:** Foreign key reference columns used in nested lookups lack indexing. As database tables grow, Postgres will perform slow sequential scans instead of index-key lookups.
* **Critical Missing Indexes:**
  - `orders` table: no index on `user_id`, `store_id`, `driver_id`, and `status`.
  - `menu_items` table: no index on `store_id` and `category_id`.
  - `wallet_transactions` table: no index on `wallet_id` and `user_id`.
* **Fix:** Apply indexes to all referencing foreign key columns.

---

## 2. RLS POLICIES VULNERABILITIES

### Over-Permissive Write Access
* **Issue:** RLS Policies on tables like `orders` allow authenticated users to update statuses or payment values directly:
  ```sql
  CREATE POLICY "orders_own_update" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
  ```
  This permits users to update their own order status to `completed` without driver intervention or actual payment.
* **Fix:** Disable client `UPDATE` operations on the `orders` table. Move status changes to the backend API or restricted Postgres trigger functions.

---

## 3. IMMUTABLE LEDGER & TRANSACTIONS SAFETY

### Unsecured Wallet Balance Updates
* **Issue:** In `supabase_schema.sql`, the wallet transaction logic relies on client queries or RPC triggers that do not enforce transaction constraints. An attacker could insert a transaction row without corresponding balance updates in the `wallets` table.
* **Fix:** Secure balance changes using strict DB transactions. Ensure any balance update automatically inserts a corresponding audit row in `wallet_transactions` via transactional triggers.

---

## 4. GEOLOCATION ARCHITECTURE GAPS

### Basic Decimals instead of PostGIS Types
* **Issue:** Geolocation values (`lat`, `lng`) are stored as raw `DECIMAL(10,7)` coordinates. While this is sufficient for basic displays, it makes distance calculations (e.g. finding drivers within 5km of a store) slow and inefficient under load.
* **Fix:** Migrate decimal coordinates to PostGIS native `GEOGRAPHY(Point, 4326)` columns. Build spatial indexes (`GIST`) to execute fast distance queries.
