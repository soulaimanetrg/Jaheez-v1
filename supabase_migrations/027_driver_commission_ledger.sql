-- MIGRATION 027 — Driver commission ledger and shift payout controls.
-- Run this after migrations 023-026. Safe to re-run.

INSERT INTO public.app_settings (key, value) VALUES
  ('driver_delivery_commission_percent', '70'),
  ('driver_tip_commission_percent', '100'),
  ('driver_min_delivery_earning_centimes', '800'),
  ('driver_commission_hold_until_shift_end', 'true'),
  ('driver_cod_payout_requires_settlement', 'true'),
  ('driver_high_tip_review_threshold_centimes', '5000')
ON CONFLICT (key) DO NOTHING;

-- Security: app_settings previously had a broad public SELECT policy. Public
-- clients should use the backend whitelist endpoint, not read financial settings
-- directly from Supabase.
DROP POLICY IF EXISTS "app_settings_read_public" ON public.app_settings;

DROP POLICY IF EXISTS "service_role_app_settings" ON public.app_settings;
CREATE POLICY "service_role_app_settings" ON public.app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.driver_shift_records
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS ended_reason TEXT,
  ADD COLUMN IF NOT EXISTS orders_count INTEGER NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
  ADD COLUMN IF NOT EXISTS gross_delivery_fee_centimes INTEGER NOT NULL DEFAULT 0 CHECK (gross_delivery_fee_centimes >= 0),
  ADD COLUMN IF NOT EXISTS gross_tip_centimes INTEGER NOT NULL DEFAULT 0 CHECK (gross_tip_centimes >= 0),
  ADD COLUMN IF NOT EXISTS driver_delivery_earnings_centimes INTEGER NOT NULL DEFAULT 0 CHECK (driver_delivery_earnings_centimes >= 0),
  ADD COLUMN IF NOT EXISTS driver_tip_earnings_centimes INTEGER NOT NULL DEFAULT 0 CHECK (driver_tip_earnings_centimes >= 0),
  ADD COLUMN IF NOT EXISTS total_earnings_centimes INTEGER NOT NULL DEFAULT 0 CHECK (total_earnings_centimes >= 0),
  ADD COLUMN IF NOT EXISTS payable_centimes INTEGER NOT NULL DEFAULT 0 CHECK (payable_centimes >= 0),
  ADD COLUMN IF NOT EXISTS held_centimes INTEGER NOT NULL DEFAULT 0 CHECK (held_centimes >= 0),
  ADD COLUMN IF NOT EXISTS cod_collected_centimes INTEGER NOT NULL DEFAULT 0 CHECK (cod_collected_centimes >= 0),
  ADD COLUMN IF NOT EXISTS cod_due_at_close_centimes INTEGER NOT NULL DEFAULT 0 CHECK (cod_due_at_close_centimes >= 0),
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'not_ready'
    CHECK (payout_status IN ('not_ready', 'payable', 'held', 'paid', 'rejected')),
  ADD COLUMN IF NOT EXISTS hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS closed_by TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_shift_one_active
  ON public.driver_shift_records (driver_id)
  WHERE status = 'active' AND ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_driver_shift_records_driver_status
  ON public.driver_shift_records (driver_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_shift_records_payout_status
  ON public.driver_shift_records (payout_status, closed_at DESC);

CREATE TABLE IF NOT EXISTS public.driver_earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES public.driver_shift_records(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('delivery_commission', 'tip_commission', 'adjustment', 'reversal')),
  delivery_fee_centimes INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_centimes >= 0),
  tip_centimes INTEGER NOT NULL DEFAULT 0 CHECK (tip_centimes >= 0),
  delivery_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (delivery_commission_percent >= 0 AND delivery_commission_percent <= 100),
  tip_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tip_commission_percent >= 0 AND tip_commission_percent <= 100),
  minimum_applied_centimes INTEGER NOT NULL DEFAULT 0 CHECK (minimum_applied_centimes >= 0),
  amount_centimes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_shift_end'
    CHECK (status IN ('pending_shift_end', 'payable', 'held', 'paid', 'reversed')),
  hold_reason TEXT,
  is_cod_order BOOLEAN NOT NULL DEFAULT FALSE,
  cod_amount_centimes INTEGER NOT NULL DEFAULT 0 CHECK (cod_amount_centimes >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_earnings_ledger_order_source
  ON public.driver_earnings_ledger (order_id, source_type)
  WHERE order_id IS NOT NULL AND source_type IN ('delivery_commission', 'tip_commission');

CREATE INDEX IF NOT EXISTS idx_driver_earnings_ledger_driver_status
  ON public.driver_earnings_ledger (driver_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_ledger_shift
  ON public.driver_earnings_ledger (shift_id, status);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_ledger_order
  ON public.driver_earnings_ledger (order_id);

ALTER TABLE public.driver_earnings_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_driver_earnings_ledger" ON public.driver_earnings_ledger;
CREATE POLICY "service_role_driver_earnings_ledger" ON public.driver_earnings_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount_centimes INTEGER NOT NULL CHECK (amount_centimes > 0),
  rib TEXT NOT NULL DEFAULT '',
  bank_name TEXT,
  rib_holder_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_note TEXT,
  processed_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payout_requests_driver_idx ON public.payout_requests (driver_id);
CREATE INDEX IF NOT EXISTS payout_requests_status_idx ON public.payout_requests (status);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.driver_shift_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ledger_entry_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS cod_due_centimes INTEGER NOT NULL DEFAULT 0 CHECK (cod_due_centimes >= 0),
  ADD COLUMN IF NOT EXISTS held_centimes INTEGER NOT NULL DEFAULT 0 CHECK (held_centimes >= 0),
  ADD COLUMN IF NOT EXISTS payable_centimes INTEGER NOT NULL DEFAULT 0 CHECK (payable_centimes >= 0),
  ADD COLUMN IF NOT EXISTS hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_payout_requests_shift
  ON public.payout_requests (shift_id);

CREATE TABLE IF NOT EXISTS public.driver_payout_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.driver_shift_records(id) ON DELETE CASCADE,
  ledger_entry_id UUID REFERENCES public.driver_earnings_ledger(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'reversed')),
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  released_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_driver_payout_holds_driver_status
  ON public.driver_payout_holds (driver_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_payout_holds_shift
  ON public.driver_payout_holds (shift_id, status);

ALTER TABLE public.driver_payout_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_driver_payout_holds" ON public.driver_payout_holds;
CREATE POLICY "service_role_driver_payout_holds" ON public.driver_payout_holds
  FOR ALL TO service_role USING (true) WITH CHECK (true);
