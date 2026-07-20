-- Security/connectivity/fraud closure after product promotions.
-- Additive and safe to re-run. Do not edit migrations 024-031.

CREATE TABLE IF NOT EXISTS public.upload_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_email TEXT,
  folder TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_upload_audit_events_created ON public.upload_audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.risk_evidence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.fraud_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system','customer','driver','store','admin')),
  actor_id TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_evidence_events_case ON public.risk_evidence_events(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_evidence_events_order ON public.risk_evidence_events(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.device_session_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer','driver','admin','store')),
  actor_id TEXT NOT NULL,
  device_hash TEXT NOT NULL,
  session_hash TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_id TEXT,
  UNIQUE(actor_type, actor_id, device_hash)
);
CREATE INDEX IF NOT EXISTS idx_device_session_fingerprints_device ON public.device_session_fingerprints(device_hash, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.realtime_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer','driver','admin','store','anonymous')),
  actor_id TEXT,
  room TEXT NOT NULL,
  event_name TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_realtime_audit_events_room ON public.realtime_audit_events(room, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_audit_events_denied ON public.realtime_audit_events(allowed, created_at DESC) WHERE allowed = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_reviews_one_per_order
  ON public.store_reviews(order_id)
  WHERE order_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='fraud_cases'
  ) THEN
    ALTER TABLE public.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_case_type_check;
    ALTER TABLE public.fraud_cases
      ADD CONSTRAINT fraud_cases_case_type_check
      CHECK (case_type IN (
        'collusion',
        'identity_overlap',
        'tip_abuse',
        'gps_spoofing',
        'account_sharing',
        'duplicate_reference',
        'forged_store_ready',
        'financial_mismatch',
        'promo_abuse',
        'review_abuse',
        'confirmation_code_abuse',
        'stage_manipulation',
        'cod_refund_abuse'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='store_reviews' AND column_name='order_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='store_reviews_order_fk'
  ) THEN
    ALTER TABLE public.store_reviews
      ADD CONSTRAINT store_reviews_order_fk
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.upload_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_evidence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_session_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_upload_audit_events ON public.upload_audit_events;
CREATE POLICY service_role_upload_audit_events ON public.upload_audit_events FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_risk_evidence_events ON public.risk_evidence_events;
CREATE POLICY service_role_risk_evidence_events ON public.risk_evidence_events FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_device_session_fingerprints ON public.device_session_fingerprints;
CREATE POLICY service_role_device_session_fingerprints ON public.device_session_fingerprints FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_realtime_audit_events ON public.realtime_audit_events;
CREATE POLICY service_role_realtime_audit_events ON public.realtime_audit_events FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.upload_audit_events, public.risk_evidence_events, public.device_session_fingerprints, public.realtime_audit_events FROM anon, authenticated;
