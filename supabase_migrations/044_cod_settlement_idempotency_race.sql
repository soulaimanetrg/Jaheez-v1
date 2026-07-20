-- Serialize identical COD settlement requests before checking idempotency.
CREATE OR REPLACE FUNCTION public.settle_driver_cod_atomic(
  p_driver_id UUID,p_amount_centimes INTEGER,p_method TEXT,p_note TEXT,p_admin_id UUID,p_request_id TEXT,p_external_reference TEXT
) RETURNS public.cod_settlements
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_driver public.drivers;v_settlement public.cod_settlements;v_ids UUID[];
BEGIN
  IF p_request_id IS NULL OR char_length(trim(p_request_id))<8 OR p_amount_centimes<=0 THEN RAISE EXCEPTION 'bad_request: invalid settlement';END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id,0));
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

REVOKE ALL ON FUNCTION public.settle_driver_cod_atomic(UUID,INTEGER,TEXT,TEXT,UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_driver_cod_atomic(UUID,INTEGER,TEXT,TEXT,UUID,TEXT,TEXT) TO service_role;
