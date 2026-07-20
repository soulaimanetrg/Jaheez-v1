-- Internal beta only: bypass unavailable WhatsApp delivery while preserving
-- Supabase as the phone/password identity and session authority.
INSERT INTO public.app_settings (key, value) VALUES
  ('customer_otp_demo_mode', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
