-- Delay anti-fraud evidence closure.
-- Additive and safe to re-run. Do not edit migrations 024-032.

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS current_location_recorded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_location_is_mocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_location_continuity_valid BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_drivers_location_evidence
  ON public.drivers(current_location_recorded_at DESC, current_location_is_mocked, current_location_continuity_valid);

COMMENT ON COLUMN public.drivers.current_location_recorded_at IS
  'Client-reported GPS capture timestamp. Server last_seen_at remains the heartbeat source of truth.';
COMMENT ON COLUMN public.drivers.current_location_is_mocked IS
  'Driver app/device reported mocked location. Mocked GPS is never sufficient for automatic driver delay penalties.';
COMMENT ON COLUMN public.drivers.current_location_continuity_valid IS
  'Server/client continuity signal. False means GPS evidence cannot prove driver delay fault automatically.';
