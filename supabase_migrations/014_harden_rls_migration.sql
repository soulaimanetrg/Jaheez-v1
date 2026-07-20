-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 014 — Harden Database Row-Level Security (RLS)
-- Drop all client-side INSERT/UPDATE/DELETE policies on critical tables.
-- Forces all mutations to run through the secure MVC backend.
-- ═══════════════════════════════════════════════════════════════

-- 1. Orders and Order Items (No direct customer/driver inserts/updates)
DROP POLICY IF EXISTS "orders_own_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_own_update" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

-- 2. Store Reviews (No direct review inserts)
DROP POLICY IF EXISTS "reviews_own_write" ON public.store_reviews;

-- 3. User Addresses (Restrict to SELECT only, mutations via REST API)
DROP POLICY IF EXISTS "addresses_own" ON public.user_addresses;
CREATE POLICY "addresses_own_read" ON public.user_addresses 
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Favorites (Restrict to SELECT only, mutations via REST API)
DROP POLICY IF EXISTS "favs_own" ON public.favorites;
CREATE POLICY "favs_own_read" ON public.favorites 
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Chat Messages (Restrict to SELECT only, insertions via REST API)
DROP POLICY IF EXISTS "chat_insert_own" ON public.chat_messages;

-- 6. Users Profile (Restrict to SELECT only, mutations via REST API)
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
