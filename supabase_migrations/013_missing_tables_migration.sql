-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 013 — Create missing promotions, admin_login_attempts, and idempotency_keys tables
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 1. promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar            TEXT NOT NULL,
  code                TEXT,
  discount_type       TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value      INTEGER NOT NULL DEFAULT 10,
  min_order_centimes  INTEGER DEFAULT 0,
  max_uses            INTEGER,
  uses_count          INTEGER DEFAULT 0,
  start_at            TIMESTAMPTZ DEFAULT now(),
  end_at              TIMESTAMPTZ,
  is_active           BOOLEAN DEFAULT TRUE,
  store_id            UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Read policies: public reads allowed (for store list and checkout checks)
CREATE POLICY "promotions_read_all" ON public.promotions FOR SELECT USING (TRUE);

-- 2. admin_login_attempts table
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  ip          TEXT,
  success     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_email_time_idx
  ON public.admin_login_attempts (email, created_at DESC);

-- Enable RLS (no policies = only service_role/superuser can read or write)
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- 3. idempotency_keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key         TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response    JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key, user_id)
);

-- Enable RLS (no policies = only service_role/superuser can read or write)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Insert sample promotions if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.promotions LIMIT 1) THEN
    INSERT INTO public.promotions (title_ar, code, discount_type, discount_value, min_order_centimes, max_uses, uses_count, is_active)
    VALUES 
      ('خصم الصيف',   'SUMMER20', 'percentage', 20,   5000, 100, 34, TRUE),
      ('طلبك الأول',  'FIRST15',  'percentage', 15,   0,    NULL, 89, TRUE),
      ('توصيل مجاني', NULL,        'fixed',      1500, 8000, 50,  12, TRUE);
  END IF;
END $$;
