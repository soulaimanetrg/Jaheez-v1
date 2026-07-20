-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 018 — Add last_seen_at column to drivers table
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();
