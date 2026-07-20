-- Append-only compatibility repair for legacy Jaheez baselines.
-- The backend dispatch contract queries drivers.status, while older schemas
-- stored only is_active. Keep the existing boolean intact and establish the
-- explicit lifecycle column before indexes in migration 026 depend on it.

DO $$
BEGIN
  IF to_regclass('public.drivers') IS NULL THEN
    RAISE EXCEPTION 'missing required baseline table public.drivers before compatibility repair';
  END IF;
END $$;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.drivers
SET status = CASE WHEN COALESCE(is_active, FALSE) THEN 'active' ELSE 'inactive' END
WHERE status IS NULL;

ALTER TABLE public.drivers
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN status SET NOT NULL;
