-- Commission v2, evidence-based delay attribution, reliability ledgers, and
-- transactional settlement controls. Apply after 027. Safe to re-run.

INSERT INTO public.app_settings (key, value) VALUES
  ('delay_grace_minutes', '5'),
  ('delay_moderate_minutes', '5'),
  ('delay_serious_minutes', '15'),
  ('delay_extreme_minutes', '30'),
  ('delay_moderate_points', '2'),
  ('delay_serious_points', '5'),
  ('delay_extreme_points', '10'),
  ('reliability_recovery_delivery_count', '10')
  ,('store_default_prep_minutes', '20')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.commission_rate_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_percent NUMERIC(5,2) NOT NULL CHECK (delivery_percent BETWEEN 0 AND 100),
  tip_percent NUMERIC(5,2) NOT NULL CHECK (tip_percent BETWEEN 0 AND 100),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 5),
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS idx_commission_rate_versions_effective
  ON public.commission_rate_versions (effective_from DESC, effective_to);

CREATE TABLE IF NOT EXISTS public.driver_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  delivery_percent NUMERIC(5,2) NOT NULL CHECK (delivery_percent BETWEEN 0 AND 100),
  tip_percent NUMERIC(5,2) NOT NULL CHECK (tip_percent BETWEEN 0 AND 100),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 5),
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS idx_driver_commission_overrides_effective
  ON public.driver_commission_overrides (driver_id, effective_from DESC, effective_to);

ALTER TABLE public.driver_earnings_ledger
  ADD COLUMN IF NOT EXISTS rate_source TEXT NOT NULL DEFAULT 'global'
    CHECK (rate_source IN ('global', 'driver_override', 'legacy')),
  ADD COLUMN IF NOT EXISTS rate_version_id UUID REFERENCES public.commission_rate_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS override_id UUID REFERENCES public.driver_commission_overrides(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS calculation_version TEXT NOT NULL DEFAULT 'commission_v2';

ALTER TABLE public.driver_shift_records
  DROP CONSTRAINT IF EXISTS driver_shift_records_payout_status_check;

UPDATE public.driver_shift_records SET payout_status = 'pending_review' WHERE payout_status = 'payable';

ALTER TABLE public.driver_shift_records
  ALTER COLUMN payout_status SET DEFAULT 'not_ready',
  ADD CONSTRAINT driver_shift_records_payout_status_check CHECK (
    payout_status IN ('not_ready', 'pending_review', 'held', 'approved', 'paid', 'rejected', 'reversed')
  ),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_shift_payment_reference
  ON public.driver_shift_records (payment_reference)
  WHERE payment_reference IS NOT NULL;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5,2) NOT NULL DEFAULT 100
    CHECK (reliability_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS reliability_on_time_count INTEGER NOT NULL DEFAULT 0 CHECK (reliability_on_time_count >= 0),
  ADD COLUMN IF NOT EXISTS reliability_updated_at TIMESTAMPTZ;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS reliability_on_time_count INTEGER NOT NULL DEFAULT 0 CHECK (reliability_on_time_count >= 0),
  ADD COLUMN IF NOT EXISTS current_location_accuracy_meters NUMERIC(8,2);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promised_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_ready_actor_type TEXT,
  ADD COLUMN IF NOT EXISTS store_ready_actor_id TEXT,
  ADD COLUMN IF NOT EXISTS store_ready_request_id TEXT,
  ADD COLUMN IF NOT EXISTS driver_pickup_eta_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_delivery_eta_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financial_finalized_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_store_ready_request
  ON public.orders (store_ready_request_id) WHERE store_ready_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'order_confirmed','driver_offered','driver_accepted','driver_departed','driver_arrived_pickup',
    'store_ready','picked_up','driver_arrived_customer','delivered','customer_wait','safety_incident',
    'admin_pause','reassigned','correction'
  )),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system','admin','store','driver','customer')),
  actor_id TEXT,
  request_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order_time
  ON public.order_timeline_events (order_id, occurred_at, created_at);

CREATE TABLE IF NOT EXISTS public.order_delay_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  segment TEXT NOT NULL CHECK (segment IN (
    'driver_to_pickup','store_preparation','driver_after_ready','driver_to_customer',
    'customer_handoff','dispatch_platform','unknown'
  )),
  assessment_version INTEGER NOT NULL DEFAULT 1 CHECK (assessment_version > 0),
  responsible_party TEXT NOT NULL CHECK (responsible_party IN ('driver','store','customer','platform','unknown')),
  late_minutes INTEGER NOT NULL DEFAULT 0 CHECK (late_minutes >= 0),
  points_delta INTEGER NOT NULL DEFAULT 0 CHECK (points_delta BETWEEN -100 AND 100),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','overturned')),
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessed_by TEXT NOT NULL DEFAULT 'system',
  UNIQUE (order_id, segment, assessment_version)
);

CREATE INDEX IF NOT EXISTS idx_delay_assessments_driver
  ON public.order_delay_assessments (driver_id, assessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_delay_assessments_store
  ON public.order_delay_assessments (store_id, assessed_at DESC);

CREATE TABLE IF NOT EXISTS public.reliability_point_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('driver','store')),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES public.order_delay_assessments(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('delay_penalty','on_time_progress','recovery','correction','admin_adjustment')),
  points_delta INTEGER NOT NULL CHECK (points_delta BETWEEN -100 AND 100),
  score_before NUMERIC(5,2) NOT NULL CHECK (score_before BETWEEN 0 AND 100),
  score_after NUMERIC(5,2) NOT NULL CHECK (score_after BETWEEN 0 AND 100),
  reason TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  request_id TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((subject_type = 'driver' AND driver_id IS NOT NULL AND store_id IS NULL)
      OR (subject_type = 'store' AND store_id IS NOT NULL AND driver_id IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_reliability_events_driver
  ON public.reliability_point_events (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reliability_events_store
  ON public.reliability_point_events (store_id, created_at DESC);

ALTER TABLE public.commission_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_commission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_delay_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reliability_point_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_commission_rate_versions ON public.commission_rate_versions;
CREATE POLICY service_role_commission_rate_versions ON public.commission_rate_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_driver_commission_overrides ON public.driver_commission_overrides;
CREATE POLICY service_role_driver_commission_overrides ON public.driver_commission_overrides FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_order_timeline_events ON public.order_timeline_events;
CREATE POLICY service_role_order_timeline_events ON public.order_timeline_events FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_order_delay_assessments ON public.order_delay_assessments;
CREATE POLICY service_role_order_delay_assessments ON public.order_delay_assessments FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_reliability_point_events ON public.reliability_point_events;
CREATE POLICY service_role_reliability_point_events ON public.reliability_point_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Atomic, idempotent store-ready event. Timestamp is server-owned and cannot be backdated.
CREATE OR REPLACE FUNCTION public.mark_order_store_ready(
  p_order_id UUID,
  p_store_id UUID,
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_request_id TEXT
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders;
BEGIN
  IF p_actor_type NOT IN ('admin','store') THEN RAISE EXCEPTION 'forbidden: invalid store-ready actor'; END IF;
  IF p_request_id IS NULL OR char_length(trim(p_request_id)) < 8 THEN RAISE EXCEPTION 'bad_request: request id required'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.store_id <> p_store_id THEN RAISE EXCEPTION 'not_found: order/store mismatch'; END IF;
  IF v_order.status NOT IN ('confirmed','preparing') THEN RAISE EXCEPTION 'conflict: order cannot be marked ready'; END IF;
  IF v_order.store_ready_at IS NULL THEN
    UPDATE public.orders SET store_ready_at = NOW(), store_ready_actor_type = p_actor_type,
      store_ready_actor_id = p_actor_id, store_ready_request_id = p_request_id, updated_at = NOW()
      WHERE id = p_order_id RETURNING * INTO v_order;
    INSERT INTO public.order_timeline_events(order_id, store_id, driver_id, event_type, occurred_at, actor_type, actor_id, request_id)
      VALUES (p_order_id, p_store_id, v_order.driver_id, 'store_ready', v_order.store_ready_at, p_actor_type, p_actor_id, p_request_id)
      ON CONFLICT (order_id, request_id) DO NOTHING;
  END IF;
  RETURN v_order;
END $$;

REVOKE ALL ON FUNCTION public.mark_order_store_ready(UUID,UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_store_ready(UUID,UUID,TEXT,TEXT,TEXT) TO service_role;

-- Atomic score event. A unique request id makes retries safe.
CREATE OR REPLACE FUNCTION public.apply_reliability_points(
  p_subject_type TEXT,
  p_subject_id UUID,
  p_order_id UUID,
  p_assessment_id UUID,
  p_event_type TEXT,
  p_points_delta INTEGER,
  p_reason TEXT,
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_request_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS public.reliability_point_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before NUMERIC(5,2); v_after NUMERIC(5,2); v_event public.reliability_point_events;
BEGIN
  SELECT * INTO v_event FROM public.reliability_point_events WHERE request_id = p_request_id;
  IF FOUND THEN RETURN v_event; END IF;
  IF p_subject_type = 'driver' THEN
    SELECT driver_reliability_score INTO v_before FROM public.drivers WHERE id = p_subject_id FOR UPDATE;
  ELSIF p_subject_type = 'store' THEN
    SELECT reliability_score INTO v_before FROM public.stores WHERE id = p_subject_id FOR UPDATE;
  ELSE RAISE EXCEPTION 'bad_request: invalid subject type'; END IF;
  IF v_before IS NULL THEN RAISE EXCEPTION 'not_found: reliability subject'; END IF;
  v_after := GREATEST(0, LEAST(100, v_before + p_points_delta));
  IF p_subject_type = 'driver' THEN
    UPDATE public.drivers SET driver_reliability_score = v_after, reliability_updated_at = NOW() WHERE id = p_subject_id;
  ELSE
    UPDATE public.stores SET reliability_score = v_after, reliability_updated_at = NOW() WHERE id = p_subject_id;
  END IF;
  INSERT INTO public.reliability_point_events(subject_type, driver_id, store_id, order_id, assessment_id,
    event_type, points_delta, score_before, score_after, reason, actor_type, actor_id, request_id, metadata)
  VALUES (p_subject_type, CASE WHEN p_subject_type='driver' THEN p_subject_id END,
    CASE WHEN p_subject_type='store' THEN p_subject_id END, p_order_id, p_assessment_id, p_event_type,
    p_points_delta, v_before, v_after, p_reason, COALESCE(p_actor_type,'system'), p_actor_id, p_request_id,
    COALESCE(p_metadata,'{}'::jsonb)) RETURNING * INTO v_event;
  RETURN v_event;
END $$;

REVOKE ALL ON FUNCTION public.apply_reliability_points(TEXT,UUID,UUID,UUID,TEXT,INTEGER,TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_reliability_points(TEXT,UUID,UUID,UUID,TEXT,INTEGER,TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.record_on_time_reliability(
  p_subject_type TEXT, p_subject_id UUID, p_order_id UUID, p_request_id TEXT
) RETURNS public.reliability_point_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_before NUMERIC(5,2); v_after NUMERIC(5,2); v_count INTEGER; v_delta INTEGER:=0;
  v_event public.reliability_point_events;
BEGIN
  SELECT * INTO v_event FROM public.reliability_point_events WHERE request_id=p_request_id;
  IF FOUND THEN RETURN v_event; END IF;
  IF p_subject_type='driver' THEN
    SELECT driver_reliability_score,reliability_on_time_count INTO v_before,v_count FROM public.drivers WHERE id=p_subject_id FOR UPDATE;
  ELSIF p_subject_type='store' THEN
    SELECT reliability_score,reliability_on_time_count INTO v_before,v_count FROM public.stores WHERE id=p_subject_id FOR UPDATE;
  ELSE RAISE EXCEPTION 'bad_request: invalid subject'; END IF;
  IF v_before IS NULL THEN RAISE EXCEPTION 'not_found: subject'; END IF;
  v_count:=COALESCE(v_count,0)+1;
  IF v_count>=10 THEN v_delta:=CASE WHEN v_before<100 THEN 1 ELSE 0 END;v_count:=0;END IF;
  v_after:=LEAST(100,v_before+v_delta);
  IF p_subject_type='driver' THEN UPDATE public.drivers SET driver_reliability_score=v_after,reliability_on_time_count=v_count,reliability_updated_at=NOW() WHERE id=p_subject_id;
  ELSE UPDATE public.stores SET reliability_score=v_after,reliability_on_time_count=v_count,reliability_updated_at=NOW() WHERE id=p_subject_id; END IF;
  INSERT INTO public.reliability_point_events(subject_type,driver_id,store_id,order_id,event_type,points_delta,
    score_before,score_after,reason,actor_type,request_id,metadata)
  VALUES(p_subject_type,CASE WHEN p_subject_type='driver' THEN p_subject_id END,CASE WHEN p_subject_type='store' THEN p_subject_id END,
    p_order_id,CASE WHEN v_delta=1 THEN 'recovery' ELSE 'on_time_progress' END,v_delta,v_before,v_after,
    CASE WHEN v_delta=1 THEN '10 eligible on-time events' ELSE 'eligible on-time event' END,'system',p_request_id,jsonb_build_object('progress',v_count))
  RETURNING * INTO v_event;
  RETURN v_event;
END $$;
REVOKE ALL ON FUNCTION public.record_on_time_reliability(TEXT,UUID,UUID,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_on_time_reliability(TEXT,UUID,UUID,TEXT) TO service_role;

-- Harden all new tables against grants accidentally inherited from public schema defaults.
REVOKE ALL ON public.commission_rate_versions, public.driver_commission_overrides,
  public.order_timeline_events, public.order_delay_assessments, public.reliability_point_events
  FROM anon, authenticated;

-- Atomic and idempotent financial shift closure. Delay points are deliberately
-- absent from this function and can never reduce commission.
CREATE OR REPLACE FUNCTION public.close_driver_shift_financial(
  p_driver_id UUID, p_shift_id UUID, p_ended_by TEXT, p_reason TEXT
) RETURNS public.driver_shift_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_shift public.driver_shift_records; v_cod INTEGER; v_orders INTEGER; v_gross_delivery INTEGER;
  v_gross_tip INTEGER; v_delivery_earnings INTEGER; v_tip_earnings INTEGER; v_total INTEGER;
  v_cod_collected INTEGER; v_has_hold BOOLEAN; v_status TEXT; v_hold_reason TEXT;
BEGIN
  SELECT * INTO v_shift FROM public.driver_shift_records WHERE id=p_shift_id AND driver_id=p_driver_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: active shift'; END IF;
  IF v_shift.status='closed' THEN RETURN v_shift; END IF;
  IF v_shift.status<>'active' THEN RAISE EXCEPTION 'conflict: shift not active'; END IF;
  SELECT cod_balance_centimes INTO v_cod FROM public.drivers WHERE id=p_driver_id FOR UPDATE;
  SELECT COUNT(DISTINCT order_id),
    COALESCE(SUM(delivery_fee_centimes) FILTER (WHERE source_type='delivery_commission'),0),
    COALESCE(SUM(tip_centimes) FILTER (WHERE source_type='tip_commission'),0),
    COALESCE(SUM(amount_centimes) FILTER (WHERE source_type='delivery_commission'),0),
    COALESCE(SUM(amount_centimes) FILTER (WHERE source_type='tip_commission'),0),
    COALESCE(BOOL_OR(status='held'),false)
  INTO v_orders,v_gross_delivery,v_gross_tip,v_delivery_earnings,v_tip_earnings,v_has_hold
  FROM public.driver_earnings_ledger WHERE shift_id=p_shift_id AND source_type IN ('delivery_commission','tip_commission');
  SELECT COALESCE(SUM(cod),0) INTO v_cod_collected FROM (
    SELECT order_id, MAX(cod_amount_centimes) cod FROM public.driver_earnings_ledger
    WHERE shift_id=p_shift_id AND is_cod_order GROUP BY order_id
  ) distinct_cod;
  v_total := v_delivery_earnings + v_tip_earnings;
  v_status := CASE WHEN COALESCE(v_cod,0)>0 OR v_has_hold THEN 'held' ELSE 'pending_review' END;
  v_hold_reason := CASE WHEN COALESCE(v_cod,0)>0 THEN 'cod_due' WHEN v_has_hold THEN 'fraud_review' END;
  UPDATE public.driver_earnings_ledger SET status=CASE WHEN v_status='held' THEN 'held' ELSE 'payable' END,
    hold_reason=v_hold_reason, updated_at=NOW() WHERE shift_id=p_shift_id AND status IN ('pending_shift_end','held','payable');
  UPDATE public.driver_shift_records SET ended_at=NOW(), ended_by=p_ended_by, ended_reason=p_reason,
    status='closed', closed_by=p_ended_by, closed_at=NOW(), orders_count=v_orders,
    gross_delivery_fee_centimes=v_gross_delivery, gross_tip_centimes=v_gross_tip,
    driver_delivery_earnings_centimes=v_delivery_earnings, driver_tip_earnings_centimes=v_tip_earnings,
    total_earnings_centimes=v_total, payable_centimes=CASE WHEN v_status='pending_review' THEN v_total ELSE 0 END,
    held_centimes=CASE WHEN v_status='held' THEN v_total ELSE 0 END, cod_collected_centimes=v_cod_collected,
    cod_due_at_close_centimes=COALESCE(v_cod,0), payout_status=v_status, hold_reason=v_hold_reason, updated_at=NOW()
    WHERE id=p_shift_id RETURNING * INTO v_shift;
  IF v_status='held' AND NOT EXISTS (SELECT 1 FROM public.driver_payout_holds WHERE shift_id=p_shift_id AND status='active') THEN
    INSERT INTO public.driver_payout_holds(driver_id,shift_id,reason,metadata)
      VALUES(p_driver_id,p_shift_id,v_hold_reason,jsonb_build_object('cod_balance_centimes',COALESCE(v_cod,0)));
  END IF;
  RETURN v_shift;
END $$;

REVOKE ALL ON FUNCTION public.close_driver_shift_financial(UUID,UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.close_driver_shift_financial(UUID,UUID,TEXT,TEXT) TO service_role;

-- Atomic order financialization after the lifecycle has authenticated the
-- delivery confirmation. Retry-safe through financial_finalized_at and ledger uniqueness.
CREATE OR REPLACE FUNCTION public.finalize_delivered_order_financial(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_order public.orders; v_shift UUID; v_override public.driver_commission_overrides;
  v_rate public.commission_rate_versions; v_delivery_pct NUMERIC; v_tip_pct NUMERIC;
  v_source TEXT; v_delivery_c INTEGER; v_tip_c INTEGER; v_total_c INTEGER; v_delivery_earning INTEGER;
  v_tip_earning INTEGER; v_high_tip INTEGER; v_held BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.status NOT IN ('delivered','completed') OR v_order.driver_id IS NULL THEN
    RAISE EXCEPTION 'conflict: order is not delivered with a driver';
  END IF;
  IF v_order.financial_finalized_at IS NOT NULL THEN RETURN FALSE; END IF;
  SELECT id INTO v_shift FROM public.driver_shift_records WHERE driver_id=v_order.driver_id
    AND status='active' AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1 FOR UPDATE;
  IF v_shift IS NULL THEN RAISE EXCEPTION 'conflict: delivered order has no active shift'; END IF;
  SELECT * INTO v_override FROM public.driver_commission_overrides WHERE driver_id=v_order.driver_id
    AND effective_from<=NOW() AND (effective_to IS NULL OR effective_to>NOW()) ORDER BY effective_from DESC LIMIT 1;
  IF FOUND THEN v_delivery_pct:=v_override.delivery_percent;v_tip_pct:=v_override.tip_percent;v_source:='driver_override';
  ELSE
    SELECT * INTO v_rate FROM public.commission_rate_versions WHERE effective_from<=NOW()
      AND (effective_to IS NULL OR effective_to>NOW()) ORDER BY effective_from DESC LIMIT 1;
    IF FOUND THEN v_delivery_pct:=v_rate.delivery_percent;v_tip_pct:=v_rate.tip_percent;v_source:='global';
    ELSE
      SELECT COALESCE(MAX(value::numeric) FILTER(WHERE key='driver_delivery_commission_percent'),70),
        COALESCE(MAX(value::numeric) FILTER(WHERE key='driver_tip_commission_percent'),100)
        INTO v_delivery_pct,v_tip_pct FROM public.app_settings
        WHERE key IN ('driver_delivery_commission_percent','driver_tip_commission_percent');
      v_source:='global';
    END IF;
  END IF;
  v_delivery_c:=GREATEST(0,ROUND(COALESCE(v_order.delivery_fee,0)*100));
  v_tip_c:=GREATEST(0,ROUND(COALESCE(v_order.rider_tip,0)*100));
  v_total_c:=GREATEST(0,ROUND(COALESCE(v_order.total_amount,0)*100));
  v_delivery_earning:=ROUND(v_delivery_c*v_delivery_pct/100);v_tip_earning:=ROUND(v_tip_c*v_tip_pct/100);
  SELECT COALESCE(MAX(value::integer),5000) INTO v_high_tip FROM public.app_settings WHERE key='driver_high_tip_review_threshold_centimes';
  v_held:=v_high_tip>0 AND v_tip_c>=v_high_tip;
  INSERT INTO public.driver_earnings_ledger(driver_id,order_id,shift_id,source_type,delivery_fee_centimes,tip_centimes,
    delivery_commission_percent,tip_commission_percent,amount_centimes,status,hold_reason,is_cod_order,cod_amount_centimes,
    rate_source,rate_version_id,override_id,calculation_version,metadata)
  VALUES(v_order.driver_id,v_order.id,v_shift,'delivery_commission',v_delivery_c,v_tip_c,v_delivery_pct,v_tip_pct,
    v_delivery_earning,CASE WHEN v_held THEN 'held' ELSE 'pending_shift_end' END,CASE WHEN v_held THEN 'high_tip_review' END,
    v_order.payment_method='cash',CASE WHEN v_order.payment_method='cash' THEN v_total_c ELSE 0 END,v_source,
    CASE WHEN v_source='global' THEN v_rate.id END,CASE WHEN v_source='driver_override' THEN v_override.id END,
    'commission_v2',jsonb_build_object('formula','delivery_fee * delivery_percent','financial_effect_of_delay',false));
  IF v_tip_earning>0 THEN
    INSERT INTO public.driver_earnings_ledger(driver_id,order_id,shift_id,source_type,delivery_fee_centimes,tip_centimes,
      delivery_commission_percent,tip_commission_percent,amount_centimes,status,hold_reason,is_cod_order,cod_amount_centimes,
      rate_source,rate_version_id,override_id,calculation_version,metadata)
    VALUES(v_order.driver_id,v_order.id,v_shift,'tip_commission',v_delivery_c,v_tip_c,v_delivery_pct,v_tip_pct,v_tip_earning,
      CASE WHEN v_held THEN 'held' ELSE 'pending_shift_end' END,CASE WHEN v_held THEN 'high_tip_review' END,
      false,0,v_source,CASE WHEN v_source='global' THEN v_rate.id END,CASE WHEN v_source='driver_override' THEN v_override.id END,
      'commission_v2',jsonb_build_object('formula','tip * tip_percent','financial_effect_of_delay',false));
  END IF;
  UPDATE public.drivers SET jobs_completed=COALESCE(jobs_completed,0)+1,
    cod_balance_centimes=COALESCE(cod_balance_centimes,0)+CASE WHEN v_order.payment_method='cash' THEN v_total_c ELSE 0 END,
    updated_at=NOW() WHERE id=v_order.driver_id;
  UPDATE public.orders SET financial_finalized_at=NOW(),updated_at=NOW() WHERE id=v_order.id;
  RETURN TRUE;
END $$;
REVOKE ALL ON FUNCTION public.finalize_delivered_order_financial(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_delivered_order_financial(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.transition_driver_payout(
  p_shift_id UUID, p_action TEXT, p_admin_id UUID, p_note TEXT DEFAULT NULL, p_payment_reference TEXT DEFAULT NULL
) RETURNS public.driver_shift_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_shift public.driver_shift_records; v_cod INTEGER; v_now TIMESTAMPTZ:=NOW();
BEGIN
  SELECT * INTO v_shift FROM public.driver_shift_records WHERE id=p_shift_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: shift'; END IF;
  SELECT cod_balance_centimes INTO v_cod FROM public.drivers WHERE id=v_shift.driver_id FOR UPDATE;
  IF p_action='approve' THEN
    IF v_shift.payout_status<>'pending_review' OR COALESCE(v_cod,0)>0 OR v_shift.hold_reason IS NOT NULL THEN RAISE EXCEPTION 'conflict: payout not approvable'; END IF;
    UPDATE public.driver_shift_records SET payout_status='approved',approved_by=p_admin_id,approved_at=v_now,
      review_note=p_note,payable_centimes=total_earnings_centimes,updated_at=v_now WHERE id=p_shift_id RETURNING * INTO v_shift;
    UPDATE public.driver_earnings_ledger SET status='payable',hold_reason=NULL,updated_at=v_now WHERE shift_id=p_shift_id;
  ELSIF p_action='mark_paid' THEN
    IF v_shift.payout_status<>'approved' OR p_payment_reference IS NULL OR char_length(trim(p_payment_reference))<4 THEN RAISE EXCEPTION 'conflict: payout not payable'; END IF;
    UPDATE public.driver_shift_records SET payout_status='paid',payable_centimes=0,held_centimes=0,paid_by=p_admin_id,
      paid_at=v_now,payment_reference=trim(p_payment_reference),updated_at=v_now WHERE id=p_shift_id RETURNING * INTO v_shift;
    UPDATE public.driver_earnings_ledger SET status='paid',paid_at=v_now,updated_at=v_now WHERE shift_id=p_shift_id;
  ELSIF p_action='hold' THEN
    IF v_shift.payout_status IN ('paid','rejected','reversed') OR p_note IS NULL OR char_length(trim(p_note))<5 THEN RAISE EXCEPTION 'conflict: payout cannot be held'; END IF;
    UPDATE public.driver_shift_records SET payout_status='held',payable_centimes=0,held_centimes=total_earnings_centimes,
      hold_reason=trim(p_note),updated_at=v_now WHERE id=p_shift_id RETURNING * INTO v_shift;
    UPDATE public.driver_earnings_ledger SET status='held',hold_reason=trim(p_note),updated_at=v_now WHERE shift_id=p_shift_id;
  ELSIF p_action='release' THEN
    IF v_shift.payout_status<>'held' OR COALESCE(v_cod,0)>0 THEN RAISE EXCEPTION 'conflict: hold cannot be released'; END IF;
    UPDATE public.driver_shift_records SET payout_status='pending_review',payable_centimes=total_earnings_centimes,held_centimes=0,
      hold_reason=NULL,review_note=p_note,updated_at=v_now WHERE id=p_shift_id RETURNING * INTO v_shift;
    UPDATE public.driver_earnings_ledger SET status='pending_shift_end',hold_reason=NULL,updated_at=v_now WHERE shift_id=p_shift_id;
  ELSIF p_action='reject' THEN
    IF v_shift.payout_status IN ('paid','reversed') OR p_note IS NULL OR char_length(trim(p_note))<5 THEN RAISE EXCEPTION 'conflict: payout cannot be rejected'; END IF;
    UPDATE public.driver_shift_records SET payout_status='rejected',payable_centimes=0,held_centimes=total_earnings_centimes,
      hold_reason=trim(p_note),updated_at=v_now WHERE id=p_shift_id RETURNING * INTO v_shift;
    UPDATE public.driver_earnings_ledger SET status='held',hold_reason=trim(p_note),updated_at=v_now WHERE shift_id=p_shift_id;
  ELSE RAISE EXCEPTION 'bad_request: invalid payout action'; END IF;
  RETURN v_shift;
END $$;
REVOKE ALL ON FUNCTION public.transition_driver_payout(UUID,TEXT,UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.transition_driver_payout(UUID,TEXT,UUID,TEXT,TEXT) TO service_role;
