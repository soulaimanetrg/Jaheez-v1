-- Request-bound, race-safe checkout creation.
-- Deploy this migration before the backend version that calls create_order_atomic_v2.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.create_order_atomic_v2(
  p_user_id           UUID,
  p_store_id          UUID,
  p_delivery_address  TEXT,
  p_delivery_lat      DECIMAL,
  p_delivery_lng      DECIMAL,
  p_notes             TEXT,
  p_subtotal          DECIMAL,
  p_delivery_fee      DECIMAL,
  p_discount          DECIMAL,
  p_rider_tip         DECIMAL,
  p_total_amount      DECIMAL,
  p_payment_method    TEXT,
  p_items             JSONB,
  p_idempotency_key   TEXT,
  p_request_payload   JSONB,
  p_promo_id          UUID DEFAULT NULL
)
RETURNS TABLE (
  order_id            UUID,
  created_at          TIMESTAMPTZ,
  is_replay           BOOLEAN,
  cached_response     JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order_id          UUID;
  v_created_at        TIMESTAMPTZ;
  v_item              JSONB;
  v_cached_resp       JSONB;
  v_cached_user_id    UUID;
  v_promo             RECORD;
  v_request_hash      TEXT;
  v_total_units       INTEGER := 0;
BEGIN
  IF p_idempotency_key IS NULL
     OR p_idempotency_key !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$' THEN
    RAISE EXCEPTION 'idempotency_key_invalid';
  END IF;
  IF p_request_payload IS NULL OR jsonb_typeof(p_request_payload) <> 'object' THEN
    RAISE EXCEPTION 'idempotency_payload_invalid';
  END IF;
  v_request_hash := encode(digest(convert_to(p_request_payload::TEXT, 'UTF8'), 'sha256'), 'hex');

  IF NOT EXISTS (
    SELECT 1
      FROM public.users
      WHERE id = p_user_id
        AND role = 'user'
        AND COALESCE(is_banned, FALSE) = FALSE
        AND deleted_at IS NULL
        AND blocked_at IS NULL
        AND COALESCE(auth_risk_level, 'low') <> 'blocked'
  ) THEN
    RAISE EXCEPTION 'checkout_owner_inactive';
  END IF;

  -- A single, transaction-scoped lock serializes every use of the same key,
  -- including attempts from a different customer. It is released on commit.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  SELECT user_id, response
    INTO v_cached_user_id, v_cached_resp
    FROM public.idempotency_keys
    WHERE key = p_idempotency_key
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

  IF FOUND THEN
    IF v_cached_user_id <> p_user_id THEN
      RAISE EXCEPTION 'idempotency_key_owner_mismatch';
    END IF;
    IF COALESCE(v_cached_resp->>'_request_hash', '') <> v_request_hash THEN
      RAISE EXCEPTION 'idempotency_payload_mismatch';
    END IF;
    RETURN QUERY SELECT
      (v_cached_resp->>'order_id')::UUID,
      (v_cached_resp->>'created_at')::TIMESTAMPTZ,
      TRUE,
      v_cached_resp - '_request_hash';
    RETURN;
  END IF;

  IF p_payment_method <> 'cash' THEN
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;
  IF p_total_amount < 0 OR p_subtotal < 0 OR p_delivery_fee < 0
     OR p_discount < 0 OR COALESCE(p_rider_tip, 0) < 0 THEN
    RAISE EXCEPTION 'invalid_total';
  END IF;
  IF length(COALESCE(p_delivery_address, '')) < 2 OR length(p_delivery_address) > 500
     OR length(COALESCE(p_notes, '')) > 500
     OR (p_delivery_lat IS NOT NULL AND (p_delivery_lat < -90 OR p_delivery_lat > 90))
     OR (p_delivery_lng IS NOT NULL AND (p_delivery_lng < -180 OR p_delivery_lng > 180)) THEN
    RAISE EXCEPTION 'invalid_delivery_details';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1
     OR jsonb_array_length(p_items) > 30 THEN
    RAISE EXCEPTION 'invalid_items';
  END IF;

  IF p_promo_id IS NOT NULL THEN
    SELECT id, uses_count, max_uses, max_uses_per_user, is_active
      INTO v_promo
      FROM public.promotions
      WHERE id = p_promo_id
      FOR UPDATE;
    IF NOT FOUND OR v_promo.is_active IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'promo_invalid';
    END IF;
    IF v_promo.max_uses IS NOT NULL AND v_promo.max_uses > 0
       AND COALESCE(v_promo.uses_count, 0) >= v_promo.max_uses THEN
      RAISE EXCEPTION 'promo_exhausted';
    END IF;
    IF v_promo.max_uses_per_user IS NOT NULL AND v_promo.max_uses_per_user > 0
       AND (SELECT COUNT(*) FROM public.user_promo_usages
            WHERE user_id = p_user_id AND promo_id = p_promo_id) >= v_promo.max_uses_per_user THEN
      RAISE EXCEPTION 'promo_user_exhausted';
    END IF;
  END IF;

  INSERT INTO public.orders (
    user_id, store_id, delivery_address, delivery_lat, delivery_lng,
    notes, subtotal, delivery_fee, discount, rider_tip, total_amount,
    status, payment_status, payment_method
  ) VALUES (
    p_user_id, p_store_id, p_delivery_address, p_delivery_lat, p_delivery_lng,
    p_notes, p_subtotal, p_delivery_fee, p_discount, COALESCE(p_rider_tip, 0), p_total_amount,
    'pending', 'pending', 'cash'
  ) RETURNING id, public.orders.created_at INTO v_order_id, v_created_at;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'menu_item_id') IS NULL
       OR COALESCE(v_item->>'quantity', '') !~ '^[0-9]+$'
       OR (v_item->>'quantity')::INTEGER < 1
       OR (v_item->>'quantity')::INTEGER > 50
       OR COALESCE((v_item->>'unit_price')::DECIMAL, -1) < 0
       OR COALESCE((v_item->>'total_price')::DECIMAL, -1) < 0
       OR jsonb_typeof(COALESCE(v_item->'options', '[]'::jsonb)) <> 'array'
       OR jsonb_array_length(COALESCE(v_item->'options', '[]'::jsonb)) > 20 THEN
      RAISE EXCEPTION 'invalid_items';
    END IF;
    v_total_units := v_total_units + (v_item->>'quantity')::INTEGER;
    IF v_total_units > 100 THEN RAISE EXCEPTION 'invalid_items'; END IF;
    INSERT INTO public.order_items (
      order_id, menu_item_id, quantity, unit_price, total_price, options
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'total_price')::DECIMAL,
      COALESCE(v_item->'options', '[]'::jsonb)
    );
  END LOOP;

  IF p_promo_id IS NOT NULL THEN
    UPDATE public.promotions SET uses_count = COALESCE(uses_count, 0) + 1 WHERE id = p_promo_id;
    INSERT INTO public.user_promo_usages (user_id, promo_id, order_id)
      VALUES (p_user_id, p_promo_id, v_order_id);
  END IF;

  v_cached_resp := jsonb_build_object(
    'ok', TRUE,
    'order_id', v_order_id,
    'total_amount', p_total_amount,
    'subtotal', p_subtotal,
    'delivery_fee', p_delivery_fee,
    'discount', p_discount,
    'payment_method', 'cash',
    'status', 'pending',
    'created_at', v_created_at,
    '_request_hash', v_request_hash
  );

  INSERT INTO public.idempotency_keys (key, user_id, response)
    VALUES (p_idempotency_key, p_user_id, v_cached_resp);

  RETURN QUERY SELECT v_order_id, v_created_at, FALSE, v_cached_resp - '_request_hash';
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic_v2(
  UUID, UUID, TEXT, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, DECIMAL,
  DECIMAL, DECIMAL, TEXT, JSONB, TEXT, JSONB, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic_v2(
  UUID, UUID, TEXT, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, DECIMAL,
  DECIMAL, DECIMAL, TEXT, JSONB, TEXT, JSONB, UUID
) TO service_role;
