-- ════════════════════════════════════════════════════════════════
-- JAHEEZ — Production-Safe Row Level Security (RLS) Rewrites
-- ════════════════════════════════════════════════════════════════

-- Enable Row Level Security on core sensitive tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- ─── 1. ORDERS TABLE POLICIES ───────────────────────────────────

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "orders_user_own" ON public.orders;
DROP POLICY IF EXISTS "orders_user_create" ON public.orders;
DROP POLICY IF EXISTS "orders_driver_read" ON public.orders;
DROP POLICY IF EXISTS "orders_driver_select" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select" ON public.orders;

-- [READ] Users can only view their own orders
CREATE POLICY "orders_select_user" ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- [READ] Drivers can only view orders assigned to them
CREATE POLICY "orders_select_driver" ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- [WRITE] Clients are prohibited from directly inserting or updating orders.
-- No INSERT, UPDATE, or DELETE policies exist for the authenticated/public roles.
-- All writes must go through the backend API using the `service_role` key (bypasses RLS).


-- ─── 2. ORDER ITEMS TABLE POLICIES ──────────────────────────────

-- Drop legacy policies
DROP POLICY IF EXISTS "order_items_via_order" ON public.order_items;

-- [READ] Users and Drivers can view order items for their own/assigned orders
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR o.driver_id = auth.uid())
    )
  );

-- [WRITE] Directly inserting or modifying order items from the client is blocked.


-- ─── 3. WALLETS TABLE POLICIES ──────────────────────────────────

-- Drop legacy policies that allowed direct mutations
DROP POLICY IF EXISTS "wallets_own" ON public.wallets;

-- [READ] Users can only view their own wallet balance
CREATE POLICY "wallets_select" ON public.wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- [WRITE] Balance changes are strictly backend-only. Direct modifications are blocked.


-- ─── 4. WALLET TRANSACTIONS TABLE POLICIES ───────────────────────

-- Drop legacy policies
DROP POLICY IF EXISTS "wallet_tx_own" ON public.wallet_transactions;

-- [READ] Users can only view transaction logs belonging to their wallet
CREATE POLICY "wallet_tx_select" ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_transactions.wallet_id
      AND w.user_id = auth.uid()
    )
  );

-- [WRITE] Client-side insertions are strictly blocked.
