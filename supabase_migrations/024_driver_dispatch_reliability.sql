-- Phase 1 dispatch hardening: backend-owned driver availability, cooldowns,
-- reliability tracking, store capacity, dispatch mode, and event history.

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS shift_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS active_orders INTEGER NOT NULL DEFAULT 0 CHECK (active_orders >= 0),
  ADD COLUMN IF NOT EXISTS max_active_orders INTEGER NOT NULL DEFAULT 1 CHECK (max_active_orders >= 1),
  ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cooldown_reason TEXT CHECK (
    cooldown_reason IS NULL OR cooldown_reason IN (
      'DECLINED_OFFER',
      'TIMED_OUT',
      'BREAK_ABUSE',
      'ADMIN_ACTION'
    )
  ),
  ADD COLUMN IF NOT EXISTS driver_reliability_score NUMERIC(5,2) NOT NULL DEFAULT 100
    CHECK (driver_reliability_score >= 0 AND driver_reliability_score <= 100),
  ADD COLUMN IF NOT EXISTS reliability_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reliability_recovery_at TIMESTAMPTZ;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS store_capacity_state TEXT NOT NULL DEFAULT 'OPEN' CHECK (
    store_capacity_state IN ('OPEN', 'BUSY', 'OVERLOADED', 'CLOSED')
  ),
  ADD COLUMN IF NOT EXISTS dispatch_mode TEXT NOT NULL DEFAULT 'AUTO_DISPATCH' CHECK (
    dispatch_mode IN ('AUTO_DISPATCH', 'MANUAL_DISPATCH')
  );

ALTER TABLE delivery_zones
  ADD COLUMN IF NOT EXISTS dispatch_mode TEXT NOT NULL DEFAULT 'AUTO_DISPATCH' CHECK (
    dispatch_mode IN ('AUTO_DISPATCH', 'MANUAL_DISPATCH')
  );

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS dispatch_mode TEXT NOT NULL DEFAULT 'AUTO_DISPATCH' CHECK (
    dispatch_mode IN ('AUTO_DISPATCH', 'MANUAL_DISPATCH')
  );

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS customer_reliability_score NUMERIC(5,2) NOT NULL DEFAULT 100
    CHECK (customer_reliability_score >= 0 AND customer_reliability_score <= 100),
  ADD COLUMN IF NOT EXISTS customer_cancellation_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_no_show_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_unreachable_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_refund_abuse_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS dispatch_offer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'offered',
      'accepted',
      'declined',
      'timed_out',
      'expired',
      'reassigned',
      'cancelled_after_accept',
      'emergency_reassignment_requested'
    )
  ),
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_shift_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  started_by TEXT NOT NULL DEFAULT 'driver',
  ended_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_break_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL CHECK (break_type IN ('BREAK', 'FORCED_BREAK')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'driver',
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_reliability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  acceptance_rate NUMERIC(5,2) NOT NULL DEFAULT 100,
  timeout_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  lateness_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_drivers_dispatch_eligibility
  ON drivers(state, shift_active, cooldown_until, is_online, active_orders, driver_reliability_score);

CREATE INDEX IF NOT EXISTS idx_dispatch_offer_history_order
  ON dispatch_offer_history(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dispatch_offer_history_driver
  ON dispatch_offer_history(driver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_reliability_snapshots_driver_date
  ON driver_reliability_snapshots(driver_id, snapshot_date DESC);

ALTER TABLE dispatch_offer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_shift_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_reliability_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_dispatch_offer_history" ON dispatch_offer_history;
CREATE POLICY "service_role_dispatch_offer_history" ON dispatch_offer_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_driver_state_history" ON driver_state_history;
CREATE POLICY "service_role_driver_state_history" ON driver_state_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_driver_shift_records" ON driver_shift_records;
CREATE POLICY "service_role_driver_shift_records" ON driver_shift_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_driver_break_records" ON driver_break_records;
CREATE POLICY "service_role_driver_break_records" ON driver_break_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_driver_reliability_snapshots" ON driver_reliability_snapshots;
CREATE POLICY "service_role_driver_reliability_snapshots" ON driver_reliability_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);
