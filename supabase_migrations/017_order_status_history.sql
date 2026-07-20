-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 017 — Order Status History Table & Atomic Lifecycle Function
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('status_transition', 'driver_assignment', 'stage_update', 'admin_override', 'cancellation', 'completion')),
  from_status TEXT CHECK (from_status IN ('pending','confirmed','preparing','picked_up','delivered','completed','cancelled')),
  to_status   TEXT CHECK (to_status IN ('pending','confirmed','preparing','picked_up','delivered','completed','cancelled')),
  actor_type  TEXT NOT NULL CHECK (actor_type IN ('customer','driver','admin','system')),
  actor_id    TEXT, -- Supporting admin emails/emails or user/driver UUIDs
  reason      TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 1. Customers can read the status history for their own orders
-- 2. Drivers can read the status history for their assigned orders
CREATE POLICY "status_history_read" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id 
        AND (
          o.user_id = auth.uid() 
          OR o.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
        )
    )
  );

-- Atomic lifecycle function running entirely inside transaction
CREATE OR REPLACE FUNCTION public.update_order_lifecycle(
  p_order_id          UUID,
  p_actor_type        TEXT, -- 'customer', 'driver', 'admin', 'system'
  p_actor_id          TEXT, -- UUID or email/name (nullable)
  p_action            TEXT, -- 'transition', 'claim', 'stage_update'
  p_to_status         TEXT, -- target status (nullable)
  p_reason            TEXT, -- cancellation reason (nullable)
  p_metadata          JSONB  -- extra metadata like {"stage": "arrived_pickup"} (nullable)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- 1. Lock Order Row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found: Order % not found', p_order_id;
  END IF;

  v_current_status := v_order.status;
  v_current_driver_id := v_order.driver_id;
  v_current_user_id := v_order.user_id;

  -- 2. Validate Actor and Action ownership
  IF p_actor_type = 'customer' THEN
    IF p_actor_id IS NULL OR v_current_user_id::text <> p_actor_id THEN
      RAISE EXCEPTION 'forbidden_action: Customer does not own this order';
    END IF;
  ELSIF p_actor_type = 'driver' THEN
    IF p_actor_id IS NULL THEN
      RAISE EXCEPTION 'forbidden_action: Driver ID is required';
    END IF;
    v_driver_uuid := p_actor_id::UUID;
    -- If claiming, check that no driver is assigned. Otherwise, must match current driver.
    IF p_action <> 'claim' AND (v_current_driver_id IS NULL OR v_current_driver_id <> v_driver_uuid) THEN
      RAISE EXCEPTION 'forbidden_action: Order is not assigned to this driver';
    END IF;
  END IF;

  -- 3. Execute Actions
  IF p_action = 'claim' THEN
    -- Driver claims the order
    IF v_current_driver_id IS NOT NULL THEN
      RAISE EXCEPTION 'conflict_driver: Order already claimed by another driver';
    END IF;

    -- Allowed to claim from 'pending', 'confirmed', 'preparing'
    IF v_current_status NOT IN ('pending', 'confirmed', 'preparing') THEN
      RAISE EXCEPTION 'conflict_status: Order cannot be claimed in status %', v_current_status;
    END IF;

    -- If pending, transition to confirmed under 'system' actor, otherwise keep current status.
    IF v_current_status = 'pending' THEN
      v_next_status := 'confirmed';
      
      -- Update status on order
      UPDATE public.orders
      SET status = v_next_status,
          driver_id = v_driver_uuid,
          heading_to_pickup_at = now(),
          updated_at = now()
      WHERE id = p_order_id;

      -- Log status transition (system is actor confirming the order)
      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason)
      VALUES (p_order_id, 'status_transition', 'pending', 'confirmed', 'system', NULL, 'Order confirmed by driver claiming');

      -- Log driver assignment (driver claims)
      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason)
      VALUES (p_order_id, 'driver_assignment', NULL, NULL, 'driver', p_actor_id, 'Driver claimed order');

    ELSE
      -- Just assign driver and keep current status
      UPDATE public.orders
      SET driver_id = v_driver_uuid,
          heading_to_pickup_at = now(),
          updated_at = now()
      WHERE id = p_order_id;

      -- Log driver assignment (driver claims)
      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason)
      VALUES (p_order_id, 'driver_assignment', NULL, NULL, 'driver', p_actor_id, 'Driver claimed order');
      
      v_next_status := v_current_status;
    END IF;

  ELSIF p_action = 'stage_update' THEN
    -- Driver updates operational stage. Keep status unchanged.
    -- Allowed stages: 'arrived_pickup', 'arrived_customer'
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

      -- Log stage update event
      INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason, metadata)
      VALUES (p_order_id, 'stage_update', NULL, NULL, p_actor_type, p_actor_id, 'Stage updated to ' || v_stage, p_metadata);
    END;
    v_next_status := v_current_status;

  ELSIF p_action = 'transition' THEN
    v_next_status := p_to_status;
    v_event_type := 'status_transition';

    -- Validate target status transition
    IF v_next_status = 'cancelled' THEN
      IF p_actor_type = 'customer' THEN
        IF v_current_status NOT IN ('pending', 'confirmed') THEN
          RAISE EXCEPTION 'conflict_status: Customer cannot cancel order in status %', v_current_status;
        END IF;
      ELSIF p_actor_type = 'driver' THEN
        RAISE EXCEPTION 'forbidden_action: Driver cannot cancel orders';
      ELSE -- admin or system
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
      -- Gating status updates
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

    -- Update order status and related timestamps
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

    -- Log transition
    INSERT INTO public.order_status_history (order_id, event_type, from_status, to_status, actor_type, actor_id, reason, metadata)
    VALUES (p_order_id, v_event_type, v_current_status, v_next_status, p_actor_type, p_actor_id, p_reason, COALESCE(p_metadata, '{}'::jsonb));

  ELSE
    RAISE EXCEPTION 'invalid_action: Unknown action %', p_action;
  END IF;

  -- Return the updated order as JSONB
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  RETURN row_to_json(v_order)::jsonb;
END;
$$;
