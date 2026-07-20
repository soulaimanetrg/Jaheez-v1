-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 019 — Add CIN / Password Auth Columns to Drivers
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create case-insensitive unique index on normalized CIN
CREATE UNIQUE INDEX IF NOT EXISTS drivers_cin_unique_idx ON public.drivers (upper(trim(cin))) WHERE cin IS NOT NULL;
