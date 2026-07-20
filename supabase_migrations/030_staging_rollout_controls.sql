-- Staging and rollout controls. Apply after 029; never mutate historical migrations.
INSERT INTO public.app_settings(key,value) VALUES
  ('commission_payouts_enabled','false'),
  ('commission_internal_driver_allowlist','[]')
ON CONFLICT(key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.commission_payout_allowed(p_driver_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT value::boolean FROM public.app_settings WHERE key='commission_payouts_enabled'),false)
    OR COALESCE((SELECT (value::jsonb ? p_driver_id::text) FROM public.app_settings
      WHERE key='commission_internal_driver_allowlist'),false)
$$;
REVOKE ALL ON FUNCTION public.commission_payout_allowed(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commission_payout_allowed(UUID) TO service_role;

CREATE OR REPLACE VIEW public.commission_monitoring_summary AS
SELECT
  COUNT(*) FILTER(WHERE payout_status='pending_review') AS pending_review_shifts,
  COUNT(*) FILTER(WHERE payout_status='held') AS held_shifts,
  COUNT(*) FILTER(WHERE payout_status='approved') AS approved_shifts,
  COALESCE(SUM(total_earnings_centimes) FILTER(WHERE payout_status='pending_review'),0) AS pending_review_centimes,
  COALESCE(SUM(total_earnings_centimes) FILTER(WHERE payout_status='held'),0) AS held_centimes
FROM public.driver_shift_records;
REVOKE ALL ON public.commission_monitoring_summary FROM anon,authenticated;
GRANT SELECT ON public.commission_monitoring_summary TO service_role;

ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS transition_request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_transition_request_id ON public.refunds(transition_request_id)
  WHERE transition_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payout_transition_requests(
  request_id TEXT PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES public.driver_shift_records(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.payout_transition_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_payout_transition_requests ON public.payout_transition_requests;
CREATE POLICY service_role_payout_transition_requests ON public.payout_transition_requests FOR ALL TO service_role USING(true) WITH CHECK(true);
REVOKE ALL ON public.payout_transition_requests FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.transition_driver_payout_idempotent(
  p_shift_id UUID,p_action TEXT,p_admin_id UUID,p_note TEXT,p_payment_reference TEXT,p_request_id TEXT
) RETURNS public.driver_shift_records LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_existing public.payout_transition_requests;v_shift public.driver_shift_records;
BEGIN
  IF p_request_id IS NULL OR char_length(trim(p_request_id))<8 THEN RAISE EXCEPTION 'bad_request: request_id required';END IF;
  SELECT * INTO v_existing FROM public.payout_transition_requests WHERE request_id=p_request_id FOR UPDATE;
  IF FOUND THEN
    IF v_existing.shift_id<>p_shift_id OR v_existing.action<>p_action THEN RAISE EXCEPTION 'conflict: idempotency key reused';END IF;
    SELECT * INTO v_shift FROM public.driver_shift_records WHERE id=p_shift_id;RETURN v_shift;
  END IF;
  v_shift:=public.transition_driver_payout(p_shift_id,p_action,p_admin_id,p_note,p_payment_reference);
  INSERT INTO public.payout_transition_requests(request_id,shift_id,action,result)
    VALUES(trim(p_request_id),p_shift_id,p_action,to_jsonb(v_shift));
  RETURN v_shift;
END $$;
REVOKE ALL ON FUNCTION public.transition_driver_payout_idempotent(UUID,TEXT,UUID,TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.transition_driver_payout_idempotent(UUID,TEXT,UUID,TEXT,TEXT,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.transition_refund_atomic(
  p_refund_id UUID,p_status TEXT,p_admin_id UUID,p_admin_email TEXT,p_decision_note TEXT,p_request_id TEXT
) RETURNS public.refunds LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_refund public.refunds;v_wallet public.wallets;v_row public.driver_earnings_ledger;v_shift_ids UUID[];
BEGIN
  SELECT * INTO v_refund FROM public.refunds WHERE id=p_refund_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'not_found: refund';END IF;
  IF v_refund.transition_request_id=p_request_id THEN
    IF v_refund.status<>p_status THEN RAISE EXCEPTION 'conflict: idempotency key reused';END IF;RETURN v_refund;
  END IF;
  IF p_request_id IS NULL OR char_length(trim(p_request_id))<8 THEN RAISE EXCEPTION 'bad_request: request_id required';END IF;
  IF p_status='approved' AND v_refund.status<>'pending' THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status='denied' AND v_refund.status<>'pending' THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status='processing' AND v_refund.status NOT IN('pending','approved') THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status IN('completed','failed') AND v_refund.status NOT IN('pending','approved','processing') THEN RAISE EXCEPTION 'conflict: invalid refund transition';END IF;
  IF p_status='completed' AND v_refund.method='wallet' THEN
    IF v_refund.user_id IS NULL THEN RAISE EXCEPTION 'conflict: refund user missing';END IF;
    INSERT INTO public.wallets(user_id,balance_centimes) VALUES(v_refund.user_id,0) ON CONFLICT(user_id) DO NOTHING;
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id=v_refund.user_id FOR UPDATE;
    WITH inserted AS (
      INSERT INTO public.wallet_transactions(wallet_id,user_id,type,direction,amount_centimes,label,ref_id)
      VALUES(v_wallet.id,v_refund.user_id,'refund','credit',v_refund.amount_centimes,'Remboursement #'||left(v_refund.id::text,8),'refund:'||v_refund.id)
      ON CONFLICT(ref_id) DO NOTHING RETURNING 1
    ) UPDATE public.wallets SET balance_centimes=balance_centimes+v_refund.amount_centimes
      WHERE id=v_wallet.id AND EXISTS(SELECT 1 FROM inserted);
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
        v_row.delivery_commission_percent,v_row.tip_commission_percent,-ABS(v_row.amount_centimes),'reversed','refund_completed',false,0,
        jsonb_build_object('refund_id',v_refund.id),NOW(),v_row.id) ON CONFLICT(reversed_ledger_entry_id) DO NOTHING;
    END LOOP;
    UPDATE public.driver_shift_records SET payout_status='held',payable_centimes=0,held_centimes=total_earnings_centimes,
      hold_reason='refund_completed',updated_at=NOW() WHERE id=ANY(COALESCE(v_shift_ids,'{}'::uuid[])) AND payout_status NOT IN('paid','reversed');
  END IF;
  UPDATE public.refunds SET status=p_status,decision_note=p_decision_note,processed_by=p_admin_id,processed_by_email=p_admin_email,
    processed_at=NOW(),transition_request_id=trim(p_request_id),updated_at=NOW() WHERE id=p_refund_id RETURNING * INTO v_refund;
  RETURN v_refund;
END $$;
REVOKE ALL ON FUNCTION public.transition_refund_atomic(UUID,TEXT,UUID,TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.transition_refund_atomic(UUID,TEXT,UUID,TEXT,TEXT,TEXT) TO service_role;
