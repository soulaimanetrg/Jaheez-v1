-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 016 — Secure atomic order creation with idempotency
-- ═══════════════════════════════════════════════════════════════

-- First, drop the existing function to change return type signature
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, UUID, TEXT, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.create_order_atomic(
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
  p_idempotency_key   TEXT
)
RETURNS TABLE (
  order_id            UUID,
  created_at          TIMESTAMPTZ,
  is_replay           BOOLEAN,
  cached_response     JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id          UUID;
  v_created_at        TIMESTAMPTZ;
  v_item              JSONB;
  v_cached_resp       JSONB;
  v_cached_user_id    UUID;
BEGIN
  -- 1. Check idempotency if key is provided
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT user_id, response INTO v_cached_user_id, v_cached_resp
    FROM public.idempotency_keys
    WHERE key = p_idempotency_key FOR UPDATE;

    IF FOUND THEN
      IF v_cached_user_id <> p_user_id THEN
        RAISE EXCEPTION 'idempotency_key_owner_mismatch: Key belongs to another user';
      END IF;
      -- Return the cached result
      RETURN QUERY SELECT 
        (v_cached_resp->>'order_id')::UUID AS order_id, 
        (v_cached_resp->>'created_at')::TIMESTAMPTZ AS created_at, 
        TRUE AS is_replay, 
        v_cached_resp AS cached_response;
      RETURN;
    END IF;
  END IF;

  -- 2. Regular validation
  IF p_payment_method NOT IN ('cash', 'card', 'online') THEN
    RAISE EXCEPTION 'invalid_payment_method: %', p_payment_method;
  END IF;

  IF p_total_amount < 0 THEN
    RAISE EXCEPTION 'invalid_total: total_amount cannot be negative';
  END IF;

  -- 3. Create the order
  INSERT INTO public.orders (
    user_id, store_id, delivery_address, delivery_lat, delivery_lng,
    notes, subtotal, delivery_fee, discount, rider_tip, total_amount,
    status, payment_status, payment_method
  )
  VALUES (
    p_user_id, p_store_id, p_delivery_address, p_delivery_lat, p_delivery_lng,
    p_notes, p_subtotal, p_delivery_fee, p_discount, COALESCE(p_rider_tip, 0), p_total_amount,
    'pending', 'pending', p_payment_method
  )
  RETURNING id, public.orders.created_at INTO v_order_id, v_created_at;

  -- 4. Create the order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'menu_item_id') IS NULL THEN
      RAISE EXCEPTION 'missing_menu_item_id in items array';
    END IF;

    INSERT INTO public.order_items (
      order_id, menu_item_id, quantity, unit_price, total_price, options
    )
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'total_price')::DECIMAL,
      COALESCE(v_item->'options', '[]'::jsonb)
    );
  END LOOP;

  -- 5. Save the idempotency response
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    v_cached_resp := jsonb_build_object(
      'ok', true,
      'order_id', v_order_id,
      'total_amount', p_total_amount,
      'subtotal', p_subtotal,
      'delivery_fee', p_delivery_fee,
      'discount', p_discount,
      'payment_method', p_payment_method,
      'status', 'pending',
      'created_at', v_created_at
    );

    INSERT INTO public.idempotency_keys (key, user_id, response)
    VALUES (p_idempotency_key, p_user_id, v_cached_resp);
  END IF;

  RETURN QUERY SELECT v_order_id, v_created_at, FALSE AS is_replay, v_cached_resp AS cached_response;
END;
$$;
