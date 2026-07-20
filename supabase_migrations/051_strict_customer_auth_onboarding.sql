-- Strict customer authentication and authoritative delivery onboarding.

ALTER TABLE public.users
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.user_addresses
  ADD COLUMN IF NOT EXISTS building_info TEXT,
  ADD COLUMN IF NOT EXISTS nearby_landmark TEXT,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
  ADD COLUMN IF NOT EXISTS location_source TEXT;

ALTER TABLE public.user_addresses
  DROP CONSTRAINT IF EXISTS user_addresses_location_source_check;

ALTER TABLE public.user_addresses
  ADD CONSTRAINT user_addresses_location_source_check
  CHECK (location_source IS NULL OR location_source IN ('gps', 'manual_map_pin'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_addresses_one_default
  ON public.user_addresses(user_id)
  WHERE is_default = TRUE;

-- Customer mutations go through the authenticated backend, which enforces
-- safe fields and atomic default-address validation.
REVOKE INSERT, UPDATE, DELETE ON public.users FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_addresses FROM authenticated;

CREATE OR REPLACE FUNCTION public.upsert_customer_default_address(
  p_user_id UUID,
  p_address_id UUID,
  p_label TEXT,
  p_city TEXT,
  p_address TEXT,
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_building_info TEXT,
  p_nearby_landmark TEXT,
  p_delivery_instructions TEXT,
  p_location_source TEXT
)
RETURNS public.user_addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result public.user_addresses;
BEGIN
  IF p_lat IS NULL OR p_lat < -90 OR p_lat > 90 OR p_lng IS NULL OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'valid coordinates are required';
  END IF;
  IF p_location_source NOT IN ('gps', 'manual_map_pin') THEN
    RAISE EXCEPTION 'invalid location source';
  END IF;
  IF NULLIF(BTRIM(p_city), '') IS NULL OR NULLIF(BTRIM(p_address), '') IS NULL THEN
    RAISE EXCEPTION 'city and detailed address are required';
  END IF;

  UPDATE public.users SET city = BTRIM(p_city), updated_at = NOW() WHERE id = p_user_id;

  UPDATE public.user_addresses SET is_default = FALSE WHERE user_id = p_user_id AND is_default = TRUE;

  IF p_address_id IS NULL THEN
    INSERT INTO public.user_addresses (
      user_id, label, address, lat, lng, is_default, building_info,
      nearby_landmark, delivery_instructions, location_source
    ) VALUES (
      p_user_id, p_label, p_address, p_lat, p_lng, TRUE, NULLIF(p_building_info, ''),
      NULLIF(p_nearby_landmark, ''), NULLIF(p_delivery_instructions, ''), p_location_source
    ) RETURNING * INTO result;
  ELSE
    UPDATE public.user_addresses SET
      label = p_label,
      address = p_address,
      lat = p_lat,
      lng = p_lng,
      is_default = TRUE,
      building_info = NULLIF(p_building_info, ''),
      nearby_landmark = NULLIF(p_nearby_landmark, ''),
      delivery_instructions = NULLIF(p_delivery_instructions, ''),
      location_source = p_location_source
    WHERE id = p_address_id AND user_id = p_user_id
    RETURNING * INTO result;
    IF result.id IS NULL THEN RAISE EXCEPTION 'address not found'; END IF;
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_customer_default_address(UUID,UUID,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_customer_default_address(UUID,UUID,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,TEXT,TEXT,TEXT,TEXT) TO service_role;

INSERT INTO public.app_settings (key, value) VALUES
  ('feature_customer_email_password_enabled', 'true'),
  ('customer_email_signup_otp_enabled', 'true'),
  ('customer_email_signup_otp_expiry_seconds', '600'),
  ('customer_auth_strict_gate_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
