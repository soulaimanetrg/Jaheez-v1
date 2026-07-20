-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 026 — Create audit_log, refunds, cod_settlements, and missing indexes
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  1. AUDIT LOG TABLE                                          ║
-- ║  Records all admin financial operations for compliance        ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_email   TEXT,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  summary       TEXT,
  old_value     JSONB,
  new_value     JSONB,
  ip            TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin-specific audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.audit_log (admin_id, created_at DESC);
-- Index for entity-specific queries (e.g., "show all actions on this order")
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity_type, entity_id, created_at DESC);
-- Index for action-specific queries (e.g., "show all wallet_adjustments")
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action, created_at DESC);

-- RLS: no policies = only service_role (backend) can read/write
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  2. REFUNDS TABLE                                            ║
-- ║  Tracks customer refund lifecycle (pending → approved →      ║
-- ║  completed/denied/failed)                                     ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.refunds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name           TEXT,
  user_phone          TEXT,
  amount_centimes     INTEGER NOT NULL CHECK (amount_centimes > 0),
  method              TEXT NOT NULL CHECK (method IN ('wallet', 'cash', 'gateway')),
  reason              TEXT NOT NULL,
  internal_note       TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'denied', 'processing', 'completed', 'failed')),
  requested_by        UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  requested_by_email  TEXT,
  processed_by        UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  processed_by_email  TEXT,
  processed_at        TIMESTAMPTZ,
  decision_note       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON public.refunds (user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds (status, created_at DESC);

-- RLS: no policies = only service_role
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_refunds_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refunds_updated_at ON public.refunds;
CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION update_refunds_timestamp();


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  3. COD SETTLEMENTS TABLE                                    ║
-- ║  Records when drivers hand over collected cash to JAHEEZ     ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.cod_settlements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id        UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  amount_centimes  INTEGER NOT NULL CHECK (amount_centimes > 0),
  method           TEXT NOT NULL DEFAULT 'cash_window'
                     CHECK (method IN ('cash_window', 'bank_transfer', 'other')),
  status           TEXT NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed', 'disputed')),
  note             TEXT,
  confirmed_by     UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  confirmed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cod_settlements_driver ON public.cod_settlements (driver_id, created_at DESC);

ALTER TABLE public.cod_settlements ENABLE ROW LEVEL SECURITY;


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  4. PERFORMANCE INDEXES ON EXISTING TABLES                   ║
-- ║  Critical for production query performance                   ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- Orders — queried by status, user, driver, creation date constantly
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders (driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders (store_id);

-- Users — phone lookup is used in every login/registration
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);

-- Wallet transactions — queried per-user, sorted by time
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions (user_id, created_at DESC);

-- Menu items — queried by store
CREATE INDEX IF NOT EXISTS idx_menu_items_store ON public.menu_items (store_id);

-- Drivers — last_seen and status queries for dispatch
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers (status) WHERE status = 'active';


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  5. ADD deleted_at TO USERS TABLE IF MISSING                 ║
-- ╚═══════════════════════════════════════════════════════════════╝

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
