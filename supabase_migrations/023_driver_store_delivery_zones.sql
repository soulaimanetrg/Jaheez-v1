-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 023 — Add Delivery Zone Columns to Drivers & Stores
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.drivers 
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL;

ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL;
