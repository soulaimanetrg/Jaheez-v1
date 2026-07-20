-- Custom errands are reviewed manually before dispatch.
ALTER TABLE public.orders
  ALTER COLUMN store_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'store_order',
  ADD COLUMN IF NOT EXISTS request_category TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS dispatch_mode TEXT NOT NULL DEFAULT 'AUTO_DISPATCH',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check
    CHECK (order_type IN ('store_order', 'errand'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_moderation_status_check
    CHECK (moderation_status IN ('not_required', 'pending_review', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_dispatch_mode_check
    CHECK (dispatch_mode IN ('AUTO_DISPATCH', 'MANUAL_DISPATCH'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_user_idempotency_unique
  ON public.orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

INSERT INTO public.app_settings(key, value)
VALUES
  ('errand_requests_enabled', 'true'),
  ('errand_base_fee_dh', '15')
ON CONFLICT (key) DO NOTHING;
