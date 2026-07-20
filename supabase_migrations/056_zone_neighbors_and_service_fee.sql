-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 056 — Data-driven dispatch zone adjacency + service fee
--
-- 1. delivery_zones.neighbor_zone_ids replaces the Safi zone-neighbor
--    graph that was hardcoded in the assignment engine, so a second city
--    (or a zone rename) is a data change, not a deploy.
-- 2. checkout_service_fee_centimes joins app_settings so the checkout
--    service fee is operator-configurable instead of a compiled constant.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.delivery_zones
  ADD COLUMN IF NOT EXISTS neighbor_zone_ids UUID[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.delivery_zones.neighbor_zone_ids IS
  'Zone ids treated as adjacent by auto-dispatch (tier-2 candidates). Keep symmetric.';

-- Seed adjacency from the previous hardcoded Safi graph:
--   المدينة القديمة <-> حي المسيرة <-> حي الزيتون <-> المناطق البعيدة
DO $$
DECLARE
  v_medina UUID; v_massira UUID; v_zitoun UUID; v_far UUID;
BEGIN
  SELECT id INTO v_medina  FROM public.delivery_zones WHERE name_ar = 'المدينة القديمة' LIMIT 1;
  SELECT id INTO v_massira FROM public.delivery_zones WHERE name_ar = 'حي المسيرة' LIMIT 1;
  SELECT id INTO v_zitoun  FROM public.delivery_zones WHERE name_ar = 'حي الزيتون' LIMIT 1;
  SELECT id INTO v_far     FROM public.delivery_zones WHERE name_ar = 'المناطق البعيدة' LIMIT 1;

  IF v_medina IS NOT NULL AND v_massira IS NOT NULL THEN
    UPDATE public.delivery_zones SET neighbor_zone_ids = ARRAY_REMOVE(ARRAY[v_massira], NULL) WHERE id = v_medina AND neighbor_zone_ids = '{}';
  END IF;
  IF v_massira IS NOT NULL THEN
    UPDATE public.delivery_zones SET neighbor_zone_ids = ARRAY_REMOVE(ARRAY[v_medina, v_zitoun], NULL) WHERE id = v_massira AND neighbor_zone_ids = '{}';
  END IF;
  IF v_zitoun IS NOT NULL THEN
    UPDATE public.delivery_zones SET neighbor_zone_ids = ARRAY_REMOVE(ARRAY[v_massira, v_far], NULL) WHERE id = v_zitoun AND neighbor_zone_ids = '{}';
  END IF;
  IF v_far IS NOT NULL AND v_zitoun IS NOT NULL THEN
    UPDATE public.delivery_zones SET neighbor_zone_ids = ARRAY_REMOVE(ARRAY[v_zitoun], NULL) WHERE id = v_far AND neighbor_zone_ids = '{}';
  END IF;
END $$;

-- Operator-configurable checkout service fee (default matches the previous
-- compiled constant of 2 DH).
INSERT INTO public.app_settings (key, value)
VALUES ('checkout_service_fee_centimes', '200')
ON CONFLICT (key) DO NOTHING;
