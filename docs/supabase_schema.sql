-- ════════════════════════════════════════════════════════════════
-- JAHEEZ — Supabase Database Schema  (v1.0)
-- Run this in Supabase SQL Editor (once, in order).
-- ════════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user','driver','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending','confirmed','preparing','assigned',
    'picked_up','on_the_way','delivered',
    'cancelled','issue','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'food','grocery','pharmacy','package','errand','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash_on_delivery','wallet','card','cmi','payzone'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wallet_tx_type AS ENUM (
    'order_payment','refund','promo_credit','wallet_topup',
    'driver_earning','payout','cod_collected','admin_adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM (
    'pending_approval','approved','rejected','suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
    'pending','verified','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE promotion_placement AS ENUM (
    'home_hero','home_small_banner','store_detail',
    'category_page','checkout','offers_page'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 1. USERS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                 TEXT UNIQUE NOT NULL,
  full_name             TEXT NOT NULL,
  email                 TEXT,
  avatar_url            TEXT,
  role                  user_role NOT NULL DEFAULT 'user',
  trust_score           INT NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  is_banned             BOOLEAN NOT NULL DEFAULT FALSE,
  city                  TEXT,
  language              TEXT NOT NULL DEFAULT 'ar',
  is_plus_member        BOOLEAN NOT NULL DEFAULT FALSE,
  notification_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 2. ADDRESSES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'البيت',
  address     TEXT NOT NULL,
  city        TEXT NOT NULL DEFAULT 'آسفي',
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_own" ON public.addresses
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- 3. DRIVERS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.drivers (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  vehicle_type    TEXT,                          -- 'scooter','car','bicycle','foot'
  vehicle_plate   TEXT,
  is_online       BOOLEAN NOT NULL DEFAULT FALSE,
  status          driver_status NOT NULL DEFAULT 'pending_approval',
  city            TEXT NOT NULL DEFAULT 'آسفي',
  rating          NUMERIC(3,2) DEFAULT 0.0,
  total_deliveries INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_read_own" ON public.drivers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "drivers_update_own" ON public.drivers
  FOR UPDATE USING (auth.uid() = id);

CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 4. DRIVER DOCUMENTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id   UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                     -- 'id_front','id_back','license','vehicle_registration'
  url         TEXT NOT NULL,
  status      verification_status NOT NULL DEFAULT 'pending',
  admin_note  TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_docs_own" ON public.driver_documents
  USING (auth.uid() = driver_id);

-- ════════════════════════════════════════════════════════════════
-- 5. CATEGORIES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar     TEXT NOT NULL,
  name_fr     TEXT,
  name_en     TEXT,
  icon_url    TEXT,
  color       TEXT,                              -- hex for gradient
  service_type service_type,
  parent_id   UUID REFERENCES public.categories(id),
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);

-- ════════════════════════════════════════════════════════════════
-- 6. STORES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar         TEXT NOT NULL,
  name_fr         TEXT,
  description_ar  TEXT,
  logo_url        TEXT,
  cover_url       TEXT,
  category_id     UUID REFERENCES public.categories(id),
  service_type    service_type NOT NULL,
  city            TEXT NOT NULL DEFAULT 'آسفي',
  address         TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  phone           TEXT,
  whatsapp        TEXT,
  delivery_fee    INT NOT NULL DEFAULT 0,        -- minor units (centimes)
  min_order       INT NOT NULL DEFAULT 0,
  avg_prep_time   INT NOT NULL DEFAULT 20,       -- minutes
  rating          NUMERIC(3,2) DEFAULT 0.0,
  review_count    INT NOT NULL DEFAULT 0,
  is_open         BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  opening_hours   JSONB,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT USING (is_active = TRUE);

CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 7. PRODUCTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.categories(id),
  name_ar         TEXT NOT NULL,
  name_fr         TEXT,
  description_ar  TEXT,
  image_url       TEXT,
  price           INT NOT NULL CHECK (price >= 0),   -- minor units (centimes)
  original_price  INT,                               -- for discount display
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0,
  tags            TEXT[],
  options         JSONB,                             -- variations, sizes, extras
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_available = TRUE);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 8. PROMOTIONS / BANNERS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.promotions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar        TEXT NOT NULL,
  subtitle_ar     TEXT,
  cta_text_ar     TEXT,
  image_url       TEXT,
  placement       promotion_placement NOT NULL DEFAULT 'home_hero',
  target_type     TEXT,                          -- 'store','category','product','screen'
  target_id       UUID,
  target_screen   TEXT,
  discount_code   TEXT,
  discount_value  INT,                           -- percent or flat (centimes)
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions_public_read" ON public.promotions
  FOR SELECT USING (is_active = TRUE AND (ends_at IS NULL OR ends_at > NOW()));

-- ════════════════════════════════════════════════════════════════
-- 9. ORDERS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id),
  driver_id         UUID REFERENCES public.drivers(id),
  store_id          UUID REFERENCES public.stores(id),
  service_type      service_type NOT NULL,
  status            order_status NOT NULL DEFAULT 'pending',
  title             TEXT NOT NULL,
  description       TEXT,
  -- Pricing (all in minor units — centimes)
  subtotal          INT NOT NULL DEFAULT 0,
  delivery_fee      INT NOT NULL DEFAULT 0,
  discount          INT NOT NULL DEFAULT 0,
  total             INT NOT NULL DEFAULT 0,
  -- Payment
  payment_method    payment_method NOT NULL DEFAULT 'cash_on_delivery',
  payment_status    TEXT NOT NULL DEFAULT 'pending',  -- 'pending','paid','failed','refunded'
  -- Delivery
  pickup_address    TEXT,
  pickup_lat        DOUBLE PRECISION,
  pickup_lng        DOUBLE PRECISION,
  dropoff_address   TEXT NOT NULL,
  dropoff_lat       DOUBLE PRECISION,
  dropoff_lng       DOUBLE PRECISION,
  dropoff_notes     TEXT,
  -- Timing
  estimated_eta     INT,                             -- minutes
  accepted_at       TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  -- Meta
  cancel_reason     TEXT,
  rating            INT CHECK (rating BETWEEN 1 AND 5),
  review            TEXT,
  promo_code        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_user_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_user_create" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_driver_read" ON public.orders
  FOR SELECT USING (auth.uid() = driver_id);

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 10. ORDER ITEMS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id),
  name_ar     TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  INT NOT NULL CHECK (unit_price >= 0),
  total_price INT NOT NULL CHECK (total_price >= 0),
  options     JSONB,
  notes       TEXT
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_via_order" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.driver_id = auth.uid())
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 11. ORDER STATUS LOG
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.order_status_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status  order_status,
  to_status    order_status NOT NULL,
  changed_by   TEXT NOT NULL,                    -- 'user','driver','admin','system'
  actor_id     UUID,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_log_read_own" ON public.order_status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.driver_id = auth.uid())
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 12. WALLETS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.wallets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL UNIQUE,              -- user or driver id
  owner_type  TEXT NOT NULL,                    -- 'user' | 'driver'
  -- IMPORTANT: balance stored as integer centimes — never float
  balance     BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency    TEXT NOT NULL DEFAULT 'MAD',
  is_frozen   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_own" ON public.wallets
  USING (auth.uid() = owner_id);

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 13. WALLET TRANSACTIONS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id     UUID NOT NULL REFERENCES public.wallets(id),
  order_id      UUID REFERENCES public.orders(id),
  type          wallet_tx_type NOT NULL,
  amount        BIGINT NOT NULL,                 -- positive = credit, negative = debit
  balance_after BIGINT NOT NULL,
  description   TEXT,
  reference_id  TEXT,                           -- external payment ref
  created_by    UUID,                           -- admin_id if manual
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_tx_own" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND w.owner_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════
-- 14. PAYMENT TRANSACTIONS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES public.orders(id),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  method          payment_method NOT NULL,
  amount          BIGINT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'MAD',
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending','success','failed','refunded'
  gateway         TEXT,                             -- 'cmi','payzone','stripe','manual'
  gateway_ref     TEXT,
  gateway_payload JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_tx_own" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER payment_tx_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 15. DRIVER EARNINGS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id       UUID NOT NULL REFERENCES public.drivers(id),
  order_id        UUID REFERENCES public.orders(id),
  gross           BIGINT NOT NULL,               -- total delivery fee
  platform_cut    BIGINT NOT NULL DEFAULT 0,
  net             BIGINT NOT NULL,               -- what driver keeps
  is_cod          BOOLEAN NOT NULL DEFAULT FALSE,
  cod_collected   BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "earnings_own_driver" ON public.driver_earnings
  FOR SELECT USING (auth.uid() = driver_id);

-- ════════════════════════════════════════════════════════════════
-- 16. PAYOUT REQUESTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id   UUID NOT NULL REFERENCES public.drivers(id),
  amount      BIGINT NOT NULL CHECK (amount > 0),
  status      TEXT NOT NULL DEFAULT 'pending',   -- 'pending','approved','rejected','paid'
  method      TEXT NOT NULL DEFAULT 'cash',
  notes       TEXT,
  admin_note  TEXT,
  processed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_own_driver" ON public.payout_requests
  USING (auth.uid() = driver_id);

-- ════════════════════════════════════════════════════════════════
-- 17. SUPPORT REQUESTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.support_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id),
  order_id    UUID REFERENCES public.orders(id),
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',      -- 'open','in_progress','closed'
  admin_note  TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_own" ON public.support_requests
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- 18. ADMIN AUDIT LOG
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,                              -- 'order','user','driver','wallet','store'
  target_id   UUID,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin-only (no RLS policy for public users — access via service_role key only)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_deny_public" ON public.admin_audit_log
  FOR ALL USING (FALSE);

-- ════════════════════════════════════════════════════════════════
-- 19. FAVORITES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id    UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favorites_target CHECK (
    (store_id IS NOT NULL AND product_id IS NULL) OR
    (product_id IS NOT NULL AND store_id IS NULL)
  )
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- 20. SEED — Service Categories
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.categories (name_ar, name_fr, service_type, color, sort_order) VALUES
  ('طعام',         'Nourriture',    'food',     '#FF6B35', 1),
  ('بقالة',        'Épicerie',      'grocery',  '#22C55E', 2),
  ('صيدلية',       'Pharmacie',     'pharmacy', '#38BDF8', 3),
  ('توصيل طرود',   'Colis',         'package',  '#A78BFA', 4),
  ('مهام خاصة',    'Commissions',   'errand',   '#F472B6', 5)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- FUNCTIONS: auto-create wallet on new user/driver
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (owner_id, owner_type)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER user_wallet_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

CREATE OR REPLACE FUNCTION create_driver_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (owner_id, owner_type)
  VALUES (NEW.id, 'driver')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER driver_wallet_trigger
  AFTER INSERT ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION create_driver_wallet();

-- ════════════════════════════════════════════════════════════════
-- FUNCTION: auto-insert user profile on auth.users sign-up
-- (Requires a Supabase Database Webhook or Auth Hook — see docs)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ════════════════════════════════════════════════════════════════
-- Indexes for performance
-- ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id   ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_store_id  ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_category    ON public.stores(category_id);
CREATE INDEX IF NOT EXISTS idx_stores_service     ON public.stores(service_type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet   ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_order_log_order    ON public.order_status_log(order_id);
