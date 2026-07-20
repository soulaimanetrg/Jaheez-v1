-- Production completion: atomic COD/refunds, non-overlapping rates,
-- reconciliation/fraud cases, and scoped store partner credentials.
-- Apply after 028. Safe to re-run.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.refunds
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.cod_settlements
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE public.driver_earnings_ledger
  ADD COLUMN IF NOT EXISTS reversed_ledger_entry_id UUID REFERENCES public.driver_earnings_ledger(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_request_id ON public.refunds(request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_payment_reference ON public.refunds(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cod_settlements_request_id ON public.cod_settlements(request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cod_settlements_external_reference ON public.cod_settlements(external_reference) WHERE external_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_single_reversal ON public.driver_earnings_ledger(reversed_ledger_entry_id) WHERE reversed_ledger_entry_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transaction_ref ON public.wallet_transactions(ref_id) WHERE ref_id IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='commission_rate_versions_no_overlap') THEN
    ALTER TABLE public.commission_rate_versions ADD CONSTRAINT commission_rate_versions_no_overlap
      EXCLUDE USING gist (tstzrange(effective_from,COALESCE(effective_to,'infinity'::timestamptz),'[)') WITH &&);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='driver_commission_overrides_no_overlap') THEN
    ALTER TABLE public.driver_commission_overrides ADD CONSTRAINT driver_commission_overrides_no_overlap
      EXCLUDE USING gist (driver_id WITH =,tstzrange(effective_from,COALESCE(effective_to,'infinity'::timestamptz),'[)') WITH &&);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.store_partner_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL UNIQUE,
  secret_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['order:ready']::text[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  revoked_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (cardinality(scopes)>0)
);
CREATE INDEX IF NOT EXISTS idx_store_partner_credentials_store ON public.store_partner_credentials(store_id,is_active);

CREATE TABLE IF NOT EXISTS public.reconciliation_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_key TEXT NOT NULL UNIQUE,
  issue_type TEXT NOT NULL CHECK(issue_type IN ('missing_ledger','shift_total_mismatch','paid_ledger_mismatch','cod_mismatch','refund_mismatch','duplicate_reference')),
  severity TEXT NOT NULL CHECK(severity IN ('medium','high','critical')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES public.driver_shift_records(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  expected_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  actual_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved','ignored')),
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_open ON public.reconciliation_issues(status,severity,last_detected_at DESC);

CREATE TABLE IF NOT EXISTS public.fraud_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_key TEXT NOT NULL UNIQUE,
  case_type TEXT NOT NULL CHECK(case_type IN ('collusion','identity_overlap','tip_abuse','gps_spoofing','account_sharing','duplicate_reference','forged_store_ready','financial_mismatch')),
  risk_score INTEGER NOT NULL CHECK(risk_score BETWEEN 0 AND 100),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES public.driver_shift_records(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','confirmed','dismissed','resolved')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  hold_applied BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_open ON public.fraud_cases(status,risk_score DESC,created_at DESC);

ALTER TABLE public.store_partner_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_store_partner_credentials ON public.store_partner_credentials;
CREATE POLICY service_role_store_partner_credentials ON public.store_partner_credentials FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS service_role_reconciliation_issues ON public.reconciliation_issues;
CREATE POLICY service_role_reconciliation_issues ON public.reconciliation_issues FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS service_role_fraud_cases ON public.fraud_cases;
CREATE POLICY service_role_fraud_cases ON public.fraud_cases FOR ALL TO service_role USING(true) WITH CHECK(true);
REVOKE ALL ON public.store_partner_credentials,public.reconciliation_issues,public.fraud_cases FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.hold_shift_for_risk(
  p_shift_id UUID,p_reason TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status TEXT;
BEGIN
  SELECT payout_status INTO v_status FROM public.driver_shift_records WHERE id=p_shift_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'not_found: shift'; END IF;
  IF v_status IN ('paid','reversed') THEN RETURN FALSE; END IF;
  UPDATE public.driver_shift_records SET payout_status='held',hold_reason=p_reason,payable_centimes=0,
    held_centimes=total_earnings_centimes WHERE id=p_shift_id;
  UPDATE public.driver_earnings_ledger SET status='held',hold_reason=p_reason,updated_at=NOW()
    WHERE shift_id=p_shift_id AND status NOT IN ('paid','reversed');
  RETURN TRUE;
END $$;
REVOKE ALL ON FUNCTION public.hold_shift_for_risk(UUID,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hold_shift_for_risk(UUID,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.create_commission_rate_version(
  p_delivery_percent NUMERIC,p_tip_percent NUMERIC,p_effective_from TIMESTAMPTZ,p_effective_to TIMESTAMPTZ,
  p_reason TEXT,p_admin_id UUID
) RETURNS public.commission_rate_versions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_row public.commission_rate_versions;v_start TIMESTAMPTZ:=COALESCE(p_effective_from,NOW());
BEGIN
  IF p_delivery_percent NOT BETWEEN 0 AND 100 OR p_tip_percent NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'bad_request: invalid percentage';END IF;
  IF p_effective_to IS NOT NULL AND p_effective_to<=v_start THEN RAISE EXCEPTION 'bad_request: invalid effective interval';END IF;
  UPDATE public.commission_rate_versions SET effective_to=v_start WHERE effective_from<v_start AND (effective_to IS NULL OR effective_to>v_start);
  INSERT INTO public.commission_rate_versions(delivery_percent,tip_percent,effective_from,effective_to,reason,created_by)
    VALUES(p_delivery_percent,p_tip_percent,v_start,p_effective_to,p_reason,p_admin_id) RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.create_driver_commission_override(
  p_driver_id UUID,p_delivery_percent NUMERIC,p_tip_percent NUMERIC,p_effective_from TIMESTAMPTZ,p_effective_to TIMESTAMPTZ,
  p_reason TEXT,p_admin_id UUID
) RETURNS public.driver_commission_overrides
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_row public.driver_commission_overrides;v_start TIMESTAMPTZ:=COALESCE(p_effective_from,NOW());
BEGIN
  IF p_delivery_percent NOT BETWEEN 0 AND 100 OR p_tip_percent NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'bad_request: invalid percentage';END IF;
  IF p_effective_to IS NOT NULL AND p_effective_to<=v_start THEN RAISE EXCEPTION 'bad_request: invalid effective interval';END IF;
  PERFORM 1 FROM public.drivers WHERE id=p_driver_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'not_found: driver';END IF;
  UPDATE public.driver_commission_overrides SET effective_to=v_start WHERE driver_id=p_driver_id AND effective_from<v_start AND (effective_to IS NULL OR effective_to>v_start);
  INSERT INTO public.driver_commission_overrides(driver_id,delivery_percent,tip_percent,effective_from,effective_to,reason,created_by)
    VALUES(p_driver_id,p_delivery_percent,p_tip_percent,v_start,p_effective_to,p_reason,p_admin_id) RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.settle_driver_cod_atomic(
  p_driver_id UUID,p_amount_centimes INTEGER,p_method TEXT,p_note TEXT,p_admin_id UUID,p_request_id TEXT,p_external_reference TEXT
) RETURNS public.cod_settlements
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_driver public.drivers;v_settlement public.cod_settlements;v_ids UUID[];
BEGIN
  IF p_request_id IS NULL OR char_length(trim(p_request_id))<8 OR p_amount_centimes<=0 THEN RAISE EXCEPTION 'bad_request: invalid settlement';END IF;
  SELECT * INTO v_settlement FROM public.cod_settlements WHERE request_id=p_request_id;IF FOUND THEN RETURN v_settlement;END IF;
  SELECT * INTO v_driver FROM public.drivers WHERE id=p_driver_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'not_found: driver';END IF;
  IF p_amount_centimes>COALESCE(v_driver.cod_balance_centimes,0) THEN RAISE EXCEPTION 'conflict: amount exceeds COD debt';END IF;
  INSERT INTO public.cod_settlements(driver_id,amount_centimes,method,status,note,confirmed_by,confirmed_at,request_id,external_reference)
    VALUES(p_driver_id,p_amount_centimes,COALESCE(p_method,'cash_window'),'confirmed',p_note,p_admin_id,NOW(),p_request_id,p_external_reference)
    RETURNING * INTO v_settlement;
  UPDATE public.drivers SET cod_balance_centimes=cod_balance_centimes-p_amount_centimes,updated_at=NOW() WHERE id=p_driver_id;
  IF v_driver.cod_balance_centimes-p_amount_centimes=0 THEN
    SELECT ARRAY_AGG(id) INTO v_ids FROM public.driver_shift_records WHERE driver_id=p_driver_id AND payout_status='held' AND hold_reason='cod_due';
    UPDATE public.driver_shift_records SET payout_status='pending_review',payable_centimes=total_earnings_centimes,held_centimes=0,
      cod_due_at_close_centimes=0,hold_reason=NULL,updated_at=NOW() WHERE id=ANY(COALESCE(v_ids,'{}'::uuid[]));
    UPDATE public.driver_earnings_ledger SET status='pending_shift_end',hold_reason=NULL,updated_at=NOW()
      WHERE shift_id=ANY(COALESCE(v_ids,'{}'::uuid[])) AND hold_reason='cod_due';
    UPDATE public.driver_payout_holds SET status='released',released_by=p_admin_id,released_at=NOW()
      WHERE shift_id=ANY(COALESCE(v_ids,'{}'::uuid[])) AND status='active' AND reason='cod_due';
  END IF;
  RETURN v_settlement;
END $$;

CREATE OR REPLACE FUNCTION public.transition_refund_atomic(
  p_refund_id UUID,p_status TEXT,p_admin_id UUID,p_admin_email TEXT,p_decision_note TEXT,p_request_id TEXT
) RETURNS public.refunds
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_refund public.refunds;v_wallet public.wallets;v_row public.driver_earnings_ledger;v_shift_ids UUID[];
BEGIN
  SELECT * INTO v_refund FROM public.refunds WHERE id=p_refund_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'not_found: refund';END IF;
  IF v_refund.request_id IS NOT NULL AND v_refund.request_id=p_request_id AND v_refund.status=p_status THEN RETURN v_refund;END IF;
  IF p_status='approved' AND v_refund.status<>'pending' THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status='denied' AND v_refund.status<>'pending' THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status='processing' AND v_refund.status NOT IN('pending','approved') THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status IN('completed','failed') AND v_refund.status NOT IN('pending','approved','processing') THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status='completed' AND v_refund.method='wallet' THEN
    IF v_refund.user_id IS NULL THEN RAISE EXCEPTION 'conflict: refund user missing';END IF;
    INSERT INTO public.wallets(user_id,balance_centimes) VALUES(v_refund.user_id,0) ON CONFLICT(user_id) DO NOTHING;
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id=v_refund.user_id FOR UPDATE;
    INSERT INTO public.wallet_transactions(wallet_id,user_id,type,direction,amount_centimes,label,ref_id)
      VALUES(v_wallet.id,v_refund.user_id,'refund','credit',v_refund.amount_centimes,'Remboursement #'||left(v_refund.id::text,8),'refund:'||v_refund.id)
      ON CONFLICT(ref_id) DO NOTHING;
    UPDATE public.wallets SET balance_centimes=balance_centimes+v_refund.amount_centimes WHERE id=v_wallet.id
      AND NOT EXISTS(SELECT 1 FROM public.wallet_transactions WHERE ref_id='refund:'||v_refund.id AND created_at<v_refund.updated_at);
  END IF;
  IF p_status='completed' AND v_refund.order_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT shift_id) INTO v_shift_ids FROM public.driver_earnings_ledger WHERE order_id=v_refund.order_id AND shift_id IS NOT NULL;
    UPDATE public.driver_earnings_ledger SET status='held',hold_reason='refund_completed',updated_at=NOW()
      WHERE order_id=v_refund.order_id AND status NOT IN('paid','reversed');
    FOR v_row IN SELECT * FROM public.driver_earnings_ledger WHERE order_id=v_refund.order_id AND status='paid' LOOP
      INSERT INTO public.driver_earnings_ledger(driver_id,order_id,shift_id,source_type,delivery_fee_centimes,tip_centimes,
        delivery_commission_percent,tip_commission_percent,amount_centimes,status,hold_reason,is_cod_order,cod_amount_centimes,
        metadata,reversed_at,reversed_ledger_entry_id)
      VALUES(v_row.driver_id,v_row.order_id,v_row.shift_id,'reversal',v_row.delivery_fee_centimes,v_row.tip_centimes,
        v_row.delivery_commission_percent,v_row.tip_commission_percent,-ABS(v_row.amount_centimes),'reversed','refund_completed',
        false,0,jsonb_build_object('refund_id',v_refund.id),NOW(),v_row.id) ON CONFLICT(reversed_ledger_entry_id) DO NOTHING;
    END LOOP;
    UPDATE public.driver_shift_records SET payout_status='held',payable_centimes=0,held_centimes=total_earnings_centimes,
      hold_reason='refund_completed',updated_at=NOW() WHERE id=ANY(COALESCE(v_shift_ids,'{}'::uuid[])) AND payout_status NOT IN('paid','reversed');
  END IF;
  UPDATE public.refunds SET status=p_status,decision_note=p_decision_note,processed_by=p_admin_id,processed_by_email=p_admin_email,
    processed_at=NOW(),request_id=COALESCE(request_id,p_request_id),updated_at=NOW() WHERE id=p_refund_id RETURNING * INTO v_refund;
  RETURN v_refund;
END $$;

REVOKE ALL ON FUNCTION public.create_commission_rate_version(NUMERIC,NUMERIC,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_driver_commission_override(UUID,NUMERIC,NUMERIC,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.settle_driver_cod_atomic(UUID,INTEGER,TEXT,TEXT,UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.transition_refund_atomic(UUID,TEXT,UUID,TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_commission_rate_version(NUMERIC,NUMERIC,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_driver_commission_override(UUID,NUMERIC,NUMERIC,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_driver_cod_atomic(UUID,INTEGER,TEXT,TEXT,UUID,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.transition_refund_atomic(UUID,TEXT,UUID,TEXT,TEXT,TEXT) TO service_role;
