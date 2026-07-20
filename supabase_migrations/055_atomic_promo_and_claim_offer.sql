-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 055 — Atomic promo usage + authoritative claim offer check
--
-- 1. create_order_atomic gains p_promo_id: promo max-uses enforcement,
--    uses_count increment and user_promo_usages insert now happen inside
--    the same transaction as order creation (no oversell, no lost usage
--    records on crash).
-- 2. update_order_lifecycle 'claim' now validates offered_driver_id and
--    offer_expires_at under the row lock and clears the offer atomically,
--    closing the small expiry/re-offer race between the service-level
--    check and the claim.
-- 3. record_driver_claim_metrics: atomic driver acceptance counters
--    (replaces the read-modify-write in the service layer).
-- ═══════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------
-- 1. create_order_atomic with atomic promo accounting
-- ---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, UUID, TEXT, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, TEXT, JSONB, TEXT);

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
  p_idempotency_key   TEXT,
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
SET search_path = public
AS $$
DECLARE
  v_order_id          UUID;
  v_created_at        TIMESTAMPTZ;
  v_item              JSONB;
  v_cached_resp       JSONB;
  v_cached_user_id    UUID;
  v_promo             RECORD;
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

  -- 3. Promo accounting under lock. Re-validating max_uses here (not just in
  --    the service-side quote) prevents overselling a limited promo under
  --    concurrent checkouts.
  IF p_promo_id IS NOT NULL THEN
    SELECT id, uses_count, max_uses, max_uses_per_user, is_active
      INTO v_promo
      FROM public.promotions
      WHERE id = p_promo_id
      FOR UPDATE;

    IF NOT FOUND OR v_promo.is_active IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'promo_invalid: Promotion is no longer available';
    END IF;
    IF v_promo.max_uses IS NOT NULL AND v_promo.max_uses > 0
       AND COALESCE(v_promo.uses_count, 0) >= v_promo.max_uses THEN
      RAISE EXCEPTION 'promo_exhausted: Promotion usage limit reached';
    END IF;
    IF v_promo.max_uses_per_user IS NOT NULL AND v_promo.max_uses_per_user > 0 THEN
      IF (SELECT COUNT(*) FROM public.user_promo_usages
            WHERE user_id = p_user_id AND promo_id = p_promo_id) >= v_promo.max_uses_per_user THEN
        RAISE EXCEPTION 'promo_user_exhausted: Per-user promotion limit reached';
      END IF;
    END IF;
  END IF;

  -- 4. Create the order
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

  -- 5. Create the order items
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

  -- 6. Record promo usage in the same transaction
  IF p_promo_id IS NOT NULL THEN
    UPDATE public.promotions
      SET uses_count = COALESCE(uses_count, 0) + 1
      WHERE id = p_promo_id;
    INSERT INTO public.user_promo_usages (user_id, promo_id, order_id)
      VALUES (p_user_id, p_promo_id, v_order_id);
  END IF;

  -- 7. Save the idempotency response
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

REVOKE ALL ON FUNCTION public.create_order_atomic(UUID, UUID, TEXT, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, TEXT, JSONB, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(UUID, UUID, TEXT, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, TEXT, JSONB, TEXT, UUID) TO service_role;

-- ---------------------------------------------------------------
-- 2. Authoritative offer validation inside the claim branch
-- ---------------------------------------------------------------
-- Recreate update_order_lifecycle with the claim branch hardened. The body
-- is identical to migration 021 except the claim section now (a) requires
-- the order to be offered to the claiming driver and unexpired, and
-- (b) clears the offer fields in the same transaction.
CREATE OR REPLACE FUNCTION public.update_order_lifecycle(
  p_order_id          UUID,
  p_actor_type        TEXT,
  p_actor_id          TEXT,
  p_action            TEXT,
  p_to_status         TEXT,
  p_reason            TEXT,
  p_metadata          JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order             RECORD;
  v_current_status    TEXT;
  v_current_driver_id UUID;
  v_current_user_id   UUID;
  v_next_status       TEXT;
  v_driver_uuid       UUID;
  v_event_type        TEXT;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found: Order % not found', p_order_id;
  END IF;

  v_current_status := v_order.status;
  v_current_driver_id := v_order.driver_id;
  v_current_user_id := v_order.user_id;

  IF p_actor_type = 'customer' THEN
    IF p_actor_id IS NULL OR v_current_user_id::text <> p_actor_id THEN
      RAISE EXCEPTION 'forbidden_action: Customer does not own this order';
    END IF;
  ELSIF p_actor_type = 'driver' THEN
    IF p_actor_id IS NULL THEN
      RAISE EXCEPTION 'forbidden_action: Driver ID is required';
    END IF;
    v_driver_uuid := p_actor_id::UUID;
    IF p_action <> 'claim' AND (v_current_driver_id IS NULL OR v_current_driver_id <> v_driver_uuid) THEN
      RAISE EXCEPTION 'forbidden_action: Order is not assigned to this driver';
    END IF;
  END IF;

  IF p_action = 'claim' THEN
    IF v_current_driver_id IS NOT NULL THEN
      RAISE EXCEPTION 'conflict_driver: Order already claimed by another driver';
    END IF;

    IF v_current_status NOT IN ('pending', 'confirmed', 'preparing') THEN
      RAISE EXCEPTION 'conflict_status: Order cannot be claimed in status %', v_current_status;
    END IF;

    -- Authoritative offer validation under the row lock. The service layer
    -- performs the same check pre-flight for fast errors, but only this one
    -- cannot race an expiry/re-offer.
    IF v_order.offered_driver_id IS NULL OR v_order.offered_driver_id <> v_driver_uuid THEN
      RAISE EXCEPTION 'forbidden_action: Cette commande ne vous est pas offerte.';
    END IF;
    IF v_order.offer_expires_at IS NOT NULL AND v_order.offer_expires_at < NOW() THEN
      RAISE EXCEPTION 'bad_request: L''offre pour cette commande a expiré.';
    END IF;

    IF v_current_status = 'pending' THEN
      v_next_status := 'confirmed';

      UPDATE public.orders
      SET status = v_next_status,
          driver_id = v_driver_uuid,
          offered_driver_id = NULL,
          offer_expires_at = NULL,
          heading_to_pickup_at = now(),
          updated_at = now()
      WHERE id = p_order_id;

      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason)
      VALUES (p_order_id, 'status_transition', 'pending', 'confirmed', 'system', NULL, 'Order confirmed by driver claiming');

      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason)
      VALUES (p_order_id, 'driver_assignment', NULL, NULL, 'driver', p_actor_id, 'Driver claimed order');

    ELSE
      UPDATE public.orders
      SET driver_id = v_driver_uuid,
          offered_driver_id = NULL,
          offer_expires_at = NULL,
          heading_to_pickup_at = now(),
          updated_at = now()
      WHERE id = p_order_id;

      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason)
      VALUES (p_order_id, 'driver_assignment', NULL, NULL, 'driver', p_actor_id, 'Driver claimed order');

      v_next_status := v_current_status;
    END IF;

  ELSIF p_action = 'stage_update' THEN
    DECLARE
      v_stage TEXT := p_metadata->>'stage';
    BEGIN
      IF v_stage = 'arrived_pickup' THEN
        UPDATE public.orders
        SET arrived_pickup_at = now(),
            updated_at = now()
        WHERE id = p_order_id;
      ELSIF v_stage = 'arrived_customer' THEN
        UPDATE public.orders
        SET arrived_customer_at = now(),
            updated_at = now()
        WHERE id = p_order_id;
      ELSE
        RAISE EXCEPTION 'invalid_stage: Unknown stage %', v_stage;
      END IF;

      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason, metadata)
      VALUES (p_order_id, 'stage_update', NULL, NULL, p_actor_type, p_actor_id, 'Stage updated to ' || v_stage, p_metadata);
    END;
    v_next_status := v_current_status;

  ELSIF p_action = 'transition' THEN
    v_next_status := p_to_status;
    v_event_type := 'status_transition';

    IF v_next_status = 'cancelled' THEN
      IF p_actor_type = 'customer' THEN
        IF v_current_status NOT IN ('pending', 'confirmed') THEN
          RAISE EXCEPTION 'conflict_status: Customer cannot cancel order in status %', v_current_status;
        END IF;
      ELSIF p_actor_type = 'driver' THEN
        IF v_current_status NOT IN ('confirmed', 'preparing', 'picked_up') THEN
          RAISE EXCEPTION 'conflict_status: Driver cannot cancel order in status %', v_current_status;
        END IF;
      ELSE
        IF v_current_status IN ('picked_up', 'delivered') AND (p_reason IS NULL OR p_reason = '') THEN
          RAISE EXCEPTION 'bad_request: Admin must provide an explicit cancellation reason for picked_up/delivered orders';
        END IF;
        IF v_current_status = 'completed' THEN
          RAISE EXCEPTION 'conflict_status: Cannot cancel a completed order';
        END IF;
      END IF;
      v_event_type := 'cancellation';
    ELSIF v_next_status = 'completed' THEN
      IF p_actor_type = 'customer' THEN
        IF v_current_status <> 'delivered' THEN
          RAISE EXCEPTION 'conflict_status: Delivery must be confirmed in delivered status';
        END IF;
      END IF;
      v_event_type := 'completion';
    ELSE
      IF p_actor_type = 'customer' THEN
        RAISE EXCEPTION 'forbidden_action: Customer cannot transition order to status %', v_next_status;
      ELSIF p_actor_type = 'driver' THEN
        IF v_next_status = 'picked_up' THEN
          IF v_current_status NOT IN ('confirmed', 'preparing') THEN
            RAISE EXCEPTION 'conflict_status: Driver cannot pick up order in status %', v_current_status;
          END IF;
        ELSIF v_next_status = 'delivered' THEN
          IF v_current_status <> 'picked_up' THEN
            RAISE EXCEPTION 'conflict_status: Driver cannot deliver order in status %', v_current_status;
          END IF;
        ELSE
          RAISE EXCEPTION 'forbidden_action: Driver cannot transition order to status %', v_next_status;
        END IF;
      ELSIF p_actor_type = 'admin' THEN
        v_event_type := 'admin_override';
      END IF;
    END IF;

    IF v_next_status = 'cancelled' THEN
      UPDATE public.orders
      SET status = v_next_status,
          cancelled_reason = COALESCE(p_reason, 'Annulée'),
          updated_at = now()
      WHERE id = p_order_id;
    ELSIF v_next_status = 'picked_up' THEN
      UPDATE public.orders
      SET status = v_next_status,
          picked_up_at = now(),
          updated_at = now()
      WHERE id = p_order_id;
    ELSIF v_next_status = 'delivered' THEN
      UPDATE public.orders
      SET status = v_next_status,
          delivered_at = now(),
          updated_at = now()
      WHERE id = p_order_id;
    ELSE
      UPDATE public.orders
      SET status = v_next_status,
          updated_at = now()
      WHERE id = p_order_id;
    END IF;

    INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason, metadata)
    VALUES (p_order_id, v_event_type, v_current_status, v_next_status, p_actor_type, p_actor_id, p_reason, COALESCE(p_metadata, '{}'::jsonb));

  ELSE
    RAISE EXCEPTION 'invalid_action: Unknown action %', p_action;
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  RETURN row_to_json(v_order)::jsonb;
END;
$$;

-- ---------------------------------------------------------------
-- 3. Atomic driver claim metrics
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_driver_claim_metrics(p_driver_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.drivers
  SET accepted_offers = COALESCE(accepted_offers, 0) + 1,
      total_offers = GREATEST(COALESCE(total_offers, 0), COALESCE(accepted_offers, 0) + 1),
      driver_acceptance_rate = ROUND(
        (COALESCE(accepted_offers, 0) + 1) * 100.0
        / GREATEST(COALESCE(total_offers, 0), COALESCE(accepted_offers, 0) + 1), 2),
      consecutive_timeouts = 0,
      cooldown_until = NULL,
      cooldown_reason = NULL,
      state = 'ACCEPTED',
      active_orders = 1,
      last_moved_at = NOW(),
      last_movement_lat = current_lat,
      last_movement_lng = current_lng,
      updated_at = NOW()
  WHERE id = p_driver_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_driver_claim_metrics(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_driver_claim_metrics(UUID) TO service_role;
