-- ═══════════════════════════════════════════════════════════════
-- JAHEEZ — جاهز — Complete Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor:
-- supabase.com → your project → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Enable extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo coordinates (optional)

-- ── 1. USERS (extends Supabase auth.users) ──────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                TEXT UNIQUE NOT NULL,
  full_name            TEXT NOT NULL DEFAULT '',
  email                TEXT,
  avatar_url           TEXT,
  role                 TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','driver','admin')),
  trust_score          INTEGER NOT NULL DEFAULT 50,
  is_banned            BOOLEAN NOT NULL DEFAULT FALSE,
  city                 TEXT NOT NULL DEFAULT 'آسفي',
  language             TEXT NOT NULL DEFAULT 'ar' CHECK (language IN ('ar','fr','en')),
  is_plus_member       BOOLEAN NOT NULL DEFAULT FALSE,
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_token           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. STORES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  description     TEXT,
  description_ar  TEXT,
  category        TEXT NOT NULL CHECK (category IN ('food','grocery','pharmacy','parcel','errand')),
  cuisine_tags    TEXT[] DEFAULT '{}',
  logo_url        TEXT,
  cover_url       TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  address         TEXT,
  address_ar      TEXT,
  city            TEXT NOT NULL DEFAULT 'آسفي',
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  rating_avg      DECIMAL(3,2) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  is_open         BOOLEAN DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_verified     BOOLEAN DEFAULT FALSE,
  delivery_fee    DECIMAL(8,2) DEFAULT 15.00,
  min_order       DECIMAL(8,2) DEFAULT 0,
  delivery_time   INTEGER DEFAULT 30, -- minutes
  opening_hours   JSONB DEFAULT '{}',
  owner_id        UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. MENU CATEGORIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. MENU ITEMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.menu_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  name_ar      TEXT NOT NULL,
  description  TEXT,
  description_ar TEXT,
  price        DECIMAL(8,2) NOT NULL,
  image_url    TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured  BOOLEAN DEFAULT FALSE,
  sort_order   INTEGER DEFAULT 0,
  calories     INTEGER,
  allergens    TEXT[] DEFAULT '{}',
  options      JSONB    NOT NULL DEFAULT '[]',
  is_popular   BOOLEAN  DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. USER ADDRESSES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'المنزل',
  address    TEXT NOT NULL,
  lat        DECIMAL(10,7),
  lng        DECIMAL(10,7),
  is_default BOOLEAN DEFAULT FALSE,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. DRIVERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  avatar_url      TEXT,
  vehicle_type    TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle','bicycle','car')),
  vehicle_plate   TEXT,
  is_online       BOOLEAN DEFAULT FALSE,
  is_verified     BOOLEAN DEFAULT FALSE,
  rating_avg      DECIMAL(3,2) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  current_lat     DECIMAL(10,7),
  current_lng     DECIMAL(10,7),
  city            TEXT DEFAULT 'آسفي',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id),
  store_id          UUID NOT NULL REFERENCES public.stores(id),
  driver_id         UUID REFERENCES public.drivers(id),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','preparing','picked_up','delivered','completed','cancelled')),
  payment_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method    TEXT NOT NULL DEFAULT 'cash'
                    CHECK (payment_method IN ('cash','card','online')),
  delivery_address  TEXT NOT NULL,
  delivery_lat      DECIMAL(10,7),
  delivery_lng      DECIMAL(10,7),
  notes             TEXT,
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee      DECIMAL(10,2) NOT NULL DEFAULT 15,
  discount          DECIMAL(10,2) DEFAULT 0,
  total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  eta               TEXT,
  picked_up_at      TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  cancelled_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. ORDER ITEMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES public.menu_items(id),
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL,
  total_price   DECIMAL(10,2) NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. STORE REVIEWS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES public.orders(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, user_id, order_id)
);

-- ── 10. NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT DEFAULT 'general',
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. FAVORITES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites       ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Stores: anyone can read; only admins/owners write
CREATE POLICY "stores_public_read"  ON public.stores FOR SELECT USING (TRUE);

-- Menu categories: anyone can read
CREATE POLICY "menu_cats_public_read" ON public.menu_categories FOR SELECT USING (TRUE);

-- Menu items: anyone can read
CREATE POLICY "menu_items_public_read" ON public.menu_items FOR SELECT USING (TRUE);

-- User addresses: own only
CREATE POLICY "addresses_own" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);

-- Drivers: anyone can read (for tracking)
CREATE POLICY "drivers_public_read" ON public.drivers FOR SELECT USING (TRUE);

-- Orders: users see their own orders
CREATE POLICY "orders_own_select" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_own_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_own_update" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- Order items: users see items of their own orders
CREATE POLICY "order_items_own" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Reviews: anyone can read; own to write
CREATE POLICY "reviews_public_read" ON public.store_reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_own_write"   ON public.store_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "notifs_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Favorites: own only
CREATE POLICY "favs_own" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- REALTIME (for order tracking)
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: auto-update updated_at timestamp
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at   BEFORE UPDATE ON public.users   FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER stores_updated_at  BEFORE UPDATE ON public.stores  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER orders_updated_at  BEFORE UPDATE ON public.orders  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: auto-create user profile on signup
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name, email, city, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'city', 'آسفي'),
    'ar'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- SAMPLE DATA — Add your first store in Safi
-- Replace with real store info before going live.
-- ═══════════════════════════════════════════════════════════════
-- INSERT INTO public.stores (name, name_ar, category, city, lat, lng, is_open, is_featured, delivery_fee, delivery_time)
-- VALUES ('Rose Patisserie', 'روز باتيسري', 'food', 'آسفي', 32.2994, -9.2372, TRUE, TRUE, 14.00, 30);

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 002 — Wallet ledger + Support requests
-- Run in Supabase SQL Editor after initial schema.
-- ═══════════════════════════════════════════════════════════════

-- ── WALLETS (one per user, integer centimes — NO floats) ────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance_centimes INTEGER NOT NULL DEFAULT 0 CHECK (balance_centimes >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── WALLET TRANSACTIONS (ledger — every money move = 1 row) ────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id        UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount_centimes  INTEGER NOT NULL CHECK (amount_centimes > 0),
  label            TEXT NOT NULL DEFAULT '',
  sublabel         TEXT,
  ref_id           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUPPORT REQUESTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_requests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  urgency    TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal','high','urgent')),
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  order_id   TEXT,
  ref_number TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_own"   ON public.wallets             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "wallet_tx_own" ON public.wallet_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "support_own"   ON public.support_requests    FOR ALL USING (auth.uid() = user_id);

-- Auto-updated_at triggers
CREATE TRIGGER wallets_updated_at  BEFORE UPDATE ON public.wallets          FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER support_updated_at  BEFORE UPDATE ON public.support_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create wallet when user is created
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_created_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 004 — Granular notification prefs + Chat messages
-- Run in Supabase SQL Editor after migrations 001-003.
-- ═══════════════════════════════════════════════════════════════

-- Granular notification prefs on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notif_orders   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_promos   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS location_share BOOLEAN NOT NULL DEFAULT TRUE;

-- Chat messages (order-level real-time chat between user & driver)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL,
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL DEFAULT 'user' CHECK (sender_role IN ('user','driver','admin')),
  text        TEXT NOT NULL CHECK (char_length(text) > 0),
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_order_idx ON public.chat_messages (order_id, sent_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- User can read/write messages for their own orders
CREATE POLICY "chat_select_own" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT user_id FROM public.orders WHERE id = order_id
      UNION
      SELECT driver_id FROM public.orders WHERE id = order_id AND driver_id IS NOT NULL
    )
  );

CREATE POLICY "chat_insert_own" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 003 — Add options + is_popular to menu_items
-- Run in Supabase SQL Editor if your DB was created before this.
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS options    JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN          DEFAULT FALSE;

-- Example: set portion-size + supplement options on an existing item
-- UPDATE public.menu_items
-- SET options = '[
--   {"label":"الحجم","required":true,"choices":[
--     {"id":"sm","name":"صغير","extra":0},
--     {"id":"md","name":"وسط","extra":1000},
--     {"id":"lg","name":"كبير","extra":2000}
--   ]},
--   {"label":"إضافات","required":false,"choices":[
--     {"id":"cream","name":"كريمة إضافية","extra":500},
--     {"id":"fruit","name":"فواكه طازجة","extra":800}
--   ]}
-- ]'
-- WHERE id = '<your-menu-item-uuid>';

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 005 — Admin Panel RLS Policies
-- Run this in Supabase SQL Editor to grant admin users full
-- read/write access needed by the admin panel.
-- ═══════════════════════════════════════════════════════════════

-- Helper: returns TRUE if the calling JWT belongs to a user with role='admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Users: admins can read and update any user
CREATE POLICY "admin_select_all_users"
  ON public.users FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_update_all_users"
  ON public.users FOR UPDATE
  USING (is_admin());

-- Orders: admins can read and update all orders
CREATE POLICY "admin_select_all_orders"
  ON public.orders FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_update_all_orders"
  ON public.orders FOR UPDATE
  USING (is_admin());

-- Stores: admins have full CRUD
CREATE POLICY "admin_manage_stores"
  ON public.stores FOR ALL
  USING (is_admin());

-- Drivers: admins can read and update
CREATE POLICY "admin_select_all_drivers"
  ON public.drivers FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_update_all_drivers"
  ON public.drivers FOR UPDATE
  USING (is_admin());

-- Menu items + categories: admins can manage
CREATE POLICY "admin_manage_menu_items"
  ON public.menu_items FOR ALL
  USING (is_admin());

CREATE POLICY "admin_manage_menu_cats"
  ON public.menu_categories FOR ALL
  USING (is_admin());

-- Order items: admins can read
CREATE POLICY "admin_select_order_items"
  ON public.order_items FOR SELECT
  USING (is_admin());

-- Notifications: admins can manage
CREATE POLICY "admin_manage_notifications"
  ON public.notifications FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 006 — Dedicated Admins table (separate from users)
-- Run in Supabase SQL Editor after Migration 005
-- ═══════════════════════════════════════════════════════════════

-- 1. Create the admins table (completely separate from public.users)
CREATE TABLE IF NOT EXISTS public.admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL DEFAULT 'مشرف',
  role        TEXT NOT NULL DEFAULT 'admin'
              CHECK (role IN ('super_admin', 'admin', 'manager', 'support')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. An admin can read their own row (required for login check)
CREATE POLICY "admins_self_read"
  ON public.admins FOR SELECT
  USING (auth.uid() = auth_id);

-- 4. Update is_admin() to check the dedicated admins table instead of users.role
--    This means regular app users can NEVER gain admin access
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE auth_id = auth.uid() AND is_active = TRUE
  );
END;
$$;

-- 5. HOW TO CREATE YOUR FIRST ADMIN:
--
--    Step A: Go to Supabase → Authentication → Users → Add user
--            Enter any email + password (e.g. admin@jaheez.ma / YourPassword123)
--            Click "Create user" — copy the UUID shown
--
--    Step B: Run this SQL (replace the values):
--
--    INSERT INTO public.admins (auth_id, email, full_name, role)
--    VALUES (
--      'PASTE-UUID-FROM-STEP-A-HERE',
--      'admin@jaheez.ma',
--      'مشرف JaheeZ',
--      'super_admin'
--    );
--
--    Step C: Log in at /admin/login with the email + password from Step A

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 010 — Driver App (Phase C MVP)
-- Adds: KYC status + documents, payout requests (RIB), COD settlements,
-- driver-side order timestamps. Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 010.1 — Extend drivers with KYC status + onboarding bits
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS kyc_status      TEXT NOT NULL DEFAULT 'pending'
                            CHECK (kyc_status IN ('pending','partial','full','verified','rejected')),
  ADD COLUMN IF NOT EXISTS kyc_note        TEXT,
  ADD COLUMN IF NOT EXISTS jobs_completed  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partial_jobs_cap INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS rib             TEXT,         -- 24-digit Moroccan bank account
  ADD COLUMN IF NOT EXISTS bank_name       TEXT,
  ADD COLUMN IF NOT EXISTS rib_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS cod_balance_centimes INTEGER NOT NULL DEFAULT 0,  -- cash collected, owes JAHEEZ
  ADD COLUMN IF NOT EXISTS earnings_centimes    INTEGER NOT NULL DEFAULT 0;  -- JAHEEZ owes driver

-- Migrate legacy is_verified → kyc_status='verified' if rows exist
UPDATE public.drivers SET kyc_status = 'verified' WHERE is_verified = TRUE AND kyc_status = 'pending';

-- 010.2 — Driver KYC documents
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('cin_front','cin_back','selfie','permis','carte_grise','assurance')),
  url          TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_by  UUID,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS driver_documents_driver_idx ON public.driver_documents (driver_id);

-- 010.3 — Payout requests (driver → admin → bank)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id       UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount_centimes INTEGER NOT NULL CHECK (amount_centimes > 0),
  rib             TEXT NOT NULL,
  bank_name       TEXT,
  rib_holder_name TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','paid','rejected')),
  admin_note      TEXT,
  processed_by    UUID,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payout_requests_driver_idx ON public.payout_requests (driver_id);
CREATE INDEX IF NOT EXISTS payout_requests_status_idx ON public.payout_requests (status);

-- 010.4 — COD settlements (driver hands cash float back to JAHEEZ)
CREATE TABLE IF NOT EXISTS public.cod_settlements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id       UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount_centimes INTEGER NOT NULL CHECK (amount_centimes > 0),
  method          TEXT NOT NULL DEFAULT 'cash_window'
                    CHECK (method IN ('cash_window','bank_transfer','wallet')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','disputed')),
  note            TEXT,
  confirmed_by    UUID,
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cod_settlements_driver_idx ON public.cod_settlements (driver_id);

-- 010.5 — Order driver-side timestamps for the 5-stage flow
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS heading_to_pickup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_pickup_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_customer_at  TIMESTAMPTZ;

-- 010.6 — RLS on new tables
ALTER TABLE public.driver_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cod_settlements   ENABLE ROW LEVEL SECURITY;

-- Drivers can read/write their own docs & requests; admin uses service_role (bypasses RLS).
CREATE POLICY "drv_docs_own"   ON public.driver_documents FOR ALL
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "drv_payouts_own" ON public.payout_requests FOR ALL
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "drv_cod_own"    ON public.cod_settlements FOR ALL
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

-- 010.7 — Realtime for driver dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_documents;

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 011 — Wallet freeze (admin manual adjustment support)
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS is_frozen     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS frozen_reason TEXT,
  ADD COLUMN IF NOT EXISTS frozen_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS frozen_by     TEXT;

-- 011.1 — Atomic wallet adjustment RPC
-- Used by admin-api POST /admin-api/wallets/:user_id/adjust to guarantee
-- balance update + ledger insert happen in one transaction with row lock.
-- Returns json: { old_balance_centimes, new_balance_centimes, wallet_id, tx_id }.
-- Raises exception (rolled back) if balance would go negative or wallet missing.
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(
  p_user_id    UUID,
  p_delta      INTEGER,        -- signed: positive = credit, negative = debit
  p_tx_type    TEXT,           -- 'credit' | 'debit' (matches wallet_transactions CHECK)
  p_label      TEXT,
  p_sublabel   TEXT,
  p_ref_id     TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id      UUID;
  v_old_balance    INTEGER;
  v_new_balance    INTEGER;
  v_tx_id          UUID;
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'admin_wallet_adjust: delta must be non-zero';
  END IF;
  IF p_tx_type NOT IN ('credit','debit') THEN
    RAISE EXCEPTION 'admin_wallet_adjust: invalid tx_type %', p_tx_type;
  END IF;

  -- Lock (or create) the wallet row.
  SELECT id, balance_centimes INTO v_wallet_id, v_old_balance
    FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance_centimes)
      VALUES (p_user_id, 0)
      RETURNING id, balance_centimes INTO v_wallet_id, v_old_balance;
  END IF;

  v_new_balance := v_old_balance + p_delta;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'admin_wallet_adjust: insufficient balance (have %, need %)', v_old_balance, -p_delta;
  END IF;

  UPDATE public.wallets SET balance_centimes = v_new_balance WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount_centimes, label, sublabel, ref_id)
    VALUES (v_wallet_id, p_user_id, p_tx_type, ABS(p_delta), p_label, p_sublabel, p_ref_id)
    RETURNING id INTO v_tx_id;

  RETURN json_build_object(
    'wallet_id',            v_wallet_id,
    'old_balance_centimes', v_old_balance,
    'new_balance_centimes', v_new_balance,
    'tx_id',                v_tx_id
  );
END;
$$;

-- 011.2 — Lock down admin_wallet_adjust RPC: only callable by service_role.
-- Without this, SECURITY DEFINER + default PUBLIC EXECUTE would let any
-- authenticated client call it directly via PostgREST and move money.
REVOKE ALL ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Defence in depth: also assert the caller role inside the function body so
-- that even if EXECUTE is mistakenly granted, only service_role can run it.
CREATE OR REPLACE FUNCTION public.admin_wallet_adjust(
  p_user_id    UUID,
  p_delta      INTEGER,
  p_tx_type    TEXT,           -- 'credit' | 'debit'  (direction)
  p_label      TEXT,
  p_sublabel   TEXT,
  p_ref_id     TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id      UUID;
  v_old_balance    INTEGER;
  v_new_balance    INTEGER;
  v_tx_id          UUID;
BEGIN
  -- Caller-role guard: refuse anyone except the service role.
  IF current_setting('request.jwt.claim.role', TRUE) NOT IN ('service_role', '')
     AND current_user <> 'service_role'
     AND session_user <> 'service_role'
  THEN
    RAISE EXCEPTION 'admin_wallet_adjust: forbidden — service_role only';
  END IF;

  IF p_delta = 0 THEN
    RAISE EXCEPTION 'admin_wallet_adjust: delta must be non-zero';
  END IF;
  IF p_tx_type NOT IN ('credit','debit') THEN
    RAISE EXCEPTION 'admin_wallet_adjust: invalid direction %', p_tx_type;
  END IF;

  SELECT id, balance_centimes INTO v_wallet_id, v_old_balance
    FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance_centimes)
      VALUES (p_user_id, 0)
      RETURNING id, balance_centimes INTO v_wallet_id, v_old_balance;
  END IF;

  v_new_balance := v_old_balance + p_delta;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'admin_wallet_adjust: insufficient balance (have %, need %)', v_old_balance, -p_delta;
  END IF;

  UPDATE public.wallets SET balance_centimes = v_new_balance WHERE id = v_wallet_id;

  -- Spec 4.10: ledger row type = 'admin_adjustment'; direction stored separately.
  INSERT INTO public.wallet_transactions
    (wallet_id, user_id, type, direction, amount_centimes, label, sublabel, ref_id)
    VALUES (v_wallet_id, p_user_id, 'admin_adjustment', p_tx_type, ABS(p_delta), p_label, p_sublabel, p_ref_id)
    RETURNING id INTO v_tx_id;

  RETURN json_build_object(
    'wallet_id',            v_wallet_id,
    'old_balance_centimes', v_old_balance,
    'new_balance_centimes', v_new_balance,
    'tx_id',                v_tx_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_wallet_adjust(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 011.3 — Allow 'admin_adjustment' (and known existing kinds) in the ledger
-- type CHECK; add a `direction` column so credit/debit semantics are preserved.
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('credit','debit','refund','admin_adjustment','payout','cod_settle','topup'));
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS direction TEXT
  CHECK (direction IN ('credit','debit'));

-- 011.4 — Tighten wallet RLS so end users cannot tamper with their own
-- balance or freeze status. They keep SELECT; all mutations must come
-- from the admin API (service_role bypasses RLS).
DROP POLICY IF EXISTS "wallets_own"   ON public.wallets;
DROP POLICY IF EXISTS "wallet_tx_own" ON public.wallet_transactions;
CREATE POLICY "wallets_own_read"     ON public.wallets             FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_tx_own_read"   ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 012 — User soft-delete + 30-day PII purge (spec 2.3.7)
-- See supabase_migrations/012_user_soft_delete.sql for the canonical
-- file. The block below mirrors it so a fresh schema apply is complete.
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS users_deleted_at_idx
  ON public.users (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.purge_deleted_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER := 0;
  victim   RECORD;
BEGIN
  FOR victim IN
    SELECT id FROM public.users
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (now() - interval '30 days')
      AND (full_name IS NULL OR full_name = '')
      AND (email     IS NULL)
      AND EXISTS (
        SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = users.id
        UNION ALL
        SELECT 1 FROM public.users u
        WHERE u.id = users.id AND (u.push_token IS NOT NULL OR u.avatar_url IS NOT NULL)
      )
  LOOP
    DELETE FROM public.user_addresses WHERE user_id = victim.id;
    UPDATE public.users
       SET avatar_url = NULL,
           push_token = NULL,
           updated_at = now()
     WHERE id = victim.id;
    affected := affected + 1;
  END LOOP;
  RETURN affected;
END;
$$;

REVOKE ALL    ON FUNCTION public.purge_deleted_users() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.purge_deleted_users() TO service_role;
-- Schedule via Supabase pg_cron once per day:
--   SELECT cron.schedule('purge_deleted_users_daily', '0 3 * * *',
--                        $$ SELECT public.purge_deleted_users(); $$);
