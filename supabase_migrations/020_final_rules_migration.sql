-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 020 — Favorite Products & Dispatch Tracking
-- ═══════════════════════════════════════════════════════════════

-- 1. Create Favorite Products Table
CREATE TABLE IF NOT EXISTS public.favorite_products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, menu_item_id)
);

-- Enable RLS
ALTER TABLE public.favorite_products ENABLE ROW LEVEL SECURITY;

-- Select policy: users can only read their own favorite products
CREATE POLICY "fav_products_own" ON public.favorite_products
  FOR SELECT USING (user_id = auth.uid());

-- 2. Add Dispatch Columns to Orders Table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS offered_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_driver_ids UUID[] DEFAULT '{}';
