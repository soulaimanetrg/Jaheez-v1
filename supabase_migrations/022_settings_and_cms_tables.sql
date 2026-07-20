-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 022 — Create Settings, Cities, Zones, Categories, Banners, and Notification log tables
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 1. app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_read_public" ON public.app_settings
  FOR SELECT USING (TRUE);

-- Seed app_settings if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings LIMIT 1) THEN
    INSERT INTO public.app_settings (key, value) VALUES
      ('delivery_fee_base',        '1500'),
      ('free_delivery_threshold',  '20000'),
      ('min_order_amount',         '5000'),
      ('max_order_amount',         '500000'),
      ('platform_commission_pct',  '15'),
      ('maintenance_mode',         'false'),
      ('maintenance_message_fr',   'L''application est en maintenance. Merci de réessayer dans quelques minutes.'),
      ('maintenance_message_ar',   'التطبيق قيد الصيانة. يرجى المحاولة بعد دقائق.'),
      ('min_required_version_ios', '1.0.0'),
      ('min_required_version_android', '1.0.0'),
      ('support_phone_e164',       '+212600000000'),
      ('support_phone',            '0600000000'),
      ('whatsapp_support',         '0600000000'),
      ('city_coverage',            'آسفي'),
      ('max_delivery_radius_km',   '10');
  END IF;
END $$;


-- 2. cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    TEXT NOT NULL,
  name_fr    TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_read_public" ON public.cities
  FOR SELECT USING (TRUE);

-- Seed cities if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cities LIMIT 1) THEN
    INSERT INTO public.cities (name_ar, name_fr, sort_order, is_active) VALUES
      ('آسفي', 'Safi', 1),
      ('الدار البيضاء', 'Casablanca', 2),
      ('الرباط', 'Rabat', 3),
      ('مراكش', 'Marrakech', 4),
      ('طنجة', 'Tanger', 5),
      ('فاس', 'Fès', 6),
      ('أكادير', 'Agadir', 7),
      ('وجدة', 'Oujda', 8),
      ('مكناس', 'Meknès', 9),
      ('تطوان', 'Tétouan', 10);
  END IF;
END $$;


-- 3. service_categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT NOT NULL,
  name_fr     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('service','store','product','errand')),
  parent_id   UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  icon_emoji  TEXT,
  color_hex   TEXT DEFAULT '#F03030',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_categories_read_public" ON public.service_categories
  FOR SELECT USING (TRUE);

-- Seed service_categories if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.service_categories LIMIT 1) THEN
    INSERT INTO public.service_categories (name_ar, name_fr, type, icon_emoji, color_hex, sort_order, is_active) VALUES
      ('طعام', 'Restauration', 'service', '🍽️', '#F03030', 1),
      ('بقالة', 'Épicerie',     'service', '🛒', '#10B981', 2),
      ('صيدلية','Pharmacie',    'service', '💊', '#3A8FE8', 3),
      ('طرود',  'Colis',        'service', '📦', '#F5A623', 4),
      ('خدمات', 'Courses',      'service', '🛍️', '#9333EA', 5),
      ('عروض',  'Promos',       'service', '🎁', '#EC4899', 6),
      ('تسوق',         'Shopping',     'errand', '🛍️', '#F03030', 1),
      ('مهمة شخصية',  'Tâche perso',  'errand', '🧩', '#3A8FE8', 2),
      ('توصيل خاص',   'Livraison',    'errand', '🚚', '#10B981', 3),
      ('أخرى',         'Autre',        'errand', '✨', '#9333EA', 4);
  END IF;
END $$;


-- 4. delivery_zones table
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar             TEXT NOT NULL,
  description_ar      TEXT,
  neighborhoods       TEXT,
  delivery_fee        INTEGER DEFAULT 1500,
  min_order_centimes  INTEGER DEFAULT 0,
  is_active           BOOLEAN DEFAULT TRUE,
  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_zones_read_public" ON public.delivery_zones
  FOR SELECT USING (TRUE);

-- Seed delivery_zones if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.delivery_zones LIMIT 1) THEN
    INSERT INTO public.delivery_zones (name_ar, description_ar, neighborhoods, delivery_fee, min_order_centimes, is_active) VALUES
      ('المدينة القديمة', 'الحي التاريخي ومركز آسفي', 'المدينة، باب الخميس، الميناء', 1000, 0, TRUE),
      ('حي المسيرة', 'المنطقة الحضرية الحديثة', 'المسيرة 1، المسيرة 2، المسيرة 3', 1200, 0, TRUE),
      ('حي الزيتون', 'الحي السكني الجديد', 'الزيتون، الياسمين، النرجس', 1500, 5000, TRUE),
      ('المناطق البعيدة', 'الضواحي وما حولها', 'المنزه، الهادي، البساتين، تاكة', 2000, 10000, TRUE);
  END IF;
END $$;


-- 5. banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar    TEXT NOT NULL,
  subtitle_ar TEXT,
  image_url   TEXT,
  bg_color    TEXT DEFAULT '#F03030',
  gradient_to TEXT DEFAULT '#C42020',
  link_type   TEXT DEFAULT 'none',
  link_value  TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_read_public" ON public.banners
  FOR SELECT USING (TRUE);

-- Seed banners if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.banners LIMIT 1) THEN
    INSERT INTO public.banners (title_ar, subtitle_ar, bg_color, gradient_to, link_type, link_value, sort_order, is_active) VALUES
      ('توصيل سريع في آسفي', 'اطلب الآن واستلم في 30 دقيقة', '#F03030', '#9A0000', 'category', 'food', 0, TRUE),
      ('عروض الصيدليات', 'أدوية وعناية — توصيل فوري', '#6366F1', '#4338CA', 'category', 'pharmacy', 1, TRUE),
      ('بقالة في باب الدار', 'خضر وفواكه وكل شيء', '#10B981', '#059669', 'category', 'grocery', 2, TRUE);
  END IF;
END $$;


-- 6. notifications_log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  target       TEXT NOT NULL DEFAULT 'all',
  sent_count   INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_by      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- 7. Add is_visible to store_reviews if not exists
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE public.store_reviews ADD COLUMN IF NOT EXISTS user_name TEXT;
