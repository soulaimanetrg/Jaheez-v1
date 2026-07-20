-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 017 — Add user-specific promotion limits
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add max_uses_per_user column to promotions table
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT 1;

-- 2. Create user_promo_usages table to track individual user usages
CREATE TABLE IF NOT EXISTS public.user_promo_usages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  promo_id    UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_promo_usages ENABLE ROW LEVEL SECURITY;

-- Read policy: users can only see their own promotion usages
CREATE POLICY "user_promo_usages_select" ON public.user_promo_usages 
  FOR SELECT USING (auth.uid() = user_id);

-- Insert policy: authenticated users can log their own usages at checkout
CREATE POLICY "user_promo_usages_insert" ON public.user_promo_usages 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
