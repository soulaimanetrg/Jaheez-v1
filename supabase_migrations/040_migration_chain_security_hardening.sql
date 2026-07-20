-- Migration-chain security closure.
-- Append-only correction: hardens legacy SECURITY DEFINER RPCs and removes
-- obsolete direct-client table policies now that Jaheez is backend-only.

-- Repair a required legacy checkout table that was not present in the
-- restored baseline. This remains idempotent and runs before any policy or
-- privilege hardening refers to the table.
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.user_promo_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  promo_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
  required_table TEXT;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'orders', 'users', 'app_settings', 'promotions', 'idempotency_keys',
    'order_status_history'
  ] LOOP
    IF to_regclass('public.' || required_table) IS NULL THEN
      RAISE EXCEPTION 'missing required baseline table public.% before migration 040', required_table;
    END IF;
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_order_atomic'
  ) THEN
    RAISE EXCEPTION 'missing required baseline RPC public.create_order_atomic before migration 040';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_order_lifecycle'
  ) THEN
    RAISE EXCEPTION 'missing required baseline RPC public.update_order_lifecycle before migration 040';
  END IF;
END $$;

-- PostgreSQL grants EXECUTE to PUBLIC by default. Harden every application
-- SECURITY DEFINER function in public, including legacy overloads, and pin
-- the search path against object-shadowing attacks.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS identity_arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      -- Extension functions are provider-owned. Jaheez must not attempt to
      -- change their grants or search path; only harden functions owned by
      -- the staging/project database role.
      AND p.proowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend dependency
        WHERE dependency.classid = 'pg_proc'::regclass
          AND dependency.objid = p.oid
          AND dependency.deptype = 'e'
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.schema_name, fn.function_name, fn.identity_arguments
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      fn.schema_name, fn.function_name, fn.identity_arguments
    );
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path TO public, pg_temp',
      fn.schema_name, fn.function_name, fn.identity_arguments
    );
  END LOOP;
END $$;

-- Direct Supabase table reads/writes are no longer part of the client
-- contract. These policies exposed internal configuration, promotion limits,
-- exact address data, lifecycle history, and checkout-related rows outside
-- the backend API authority boundary.
DROP POLICY IF EXISTS "app_settings_read_public" ON public.app_settings;
DROP POLICY IF EXISTS "promotions_read_all" ON public.promotions;
DROP POLICY IF EXISTS "user_promo_usages_select" ON public.user_promo_usages;
DROP POLICY IF EXISTS "user_promo_usages_insert" ON public.user_promo_usages;
DROP POLICY IF EXISTS "status_history_read" ON public.order_status_history;
DROP POLICY IF EXISTS "addresses_own_read" ON public.user_addresses;
DROP POLICY IF EXISTS "favs_own_read" ON public.favorites;
DROP POLICY IF EXISTS "fav_products_own" ON public.favorite_products;
DROP POLICY IF EXISTS "wallets_own_read" ON public.wallets;
DROP POLICY IF EXISTS "wallet_tx_own_read" ON public.wallet_transactions;
DROP POLICY IF EXISTS "cities_read_public" ON public.cities;
DROP POLICY IF EXISTS "service_categories_read_public" ON public.service_categories;
DROP POLICY IF EXISTS "delivery_zones_read_public" ON public.delivery_zones;
DROP POLICY IF EXISTS "banners_read_public" ON public.banners;

DO $$
DECLARE
  protected_table TEXT;
  policy_record RECORD;
BEGIN
  FOREACH protected_table IN ARRAY ARRAY[
    'app_settings', 'promotions', 'user_promo_usages', 'order_status_history',
    'user_addresses', 'favorites', 'favorite_products', 'wallets',
    'wallet_transactions', 'cities', 'service_categories', 'delivery_zones',
    'banners', 'customer_analytics_events', 'errand_drafts', 'errand_quotes',
    'errand_details', 'errand_events', 'errand_proofs', 'errand_quote_adjustments'
  ] LOOP
    IF to_regclass('public.' || protected_table) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', protected_table);
      FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = protected_table
          AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, protected_table);
      END LOOP;
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', protected_table);
    END IF;
  END LOOP;
END $$;

-- Keep address coordinates at a bounded, consistent precision. The backend
-- remains responsible for validating ownership and access to exact locations.
ALTER TABLE public.user_addresses
  ALTER COLUMN lat TYPE NUMERIC(10,7) USING CASE WHEN lat IS NULL THEN NULL ELSE ROUND(lat, 7) END,
  ALTER COLUMN lng TYPE NUMERIC(10,7) USING CASE WHEN lng IS NULL THEN NULL ELSE ROUND(lng, 7) END;
