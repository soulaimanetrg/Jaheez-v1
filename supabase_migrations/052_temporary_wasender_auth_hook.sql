-- Temporary internal-beta WhatsApp delivery provider. Supabase remains the
-- OTP generator, verifier, and session authority.
INSERT INTO public.app_settings (key, value) VALUES
  ('customer_whatsapp_otp_provider', 'wasender'),
  ('auth_whatsapp_trial_mode', 'true'),
  ('feature_customer_whatsapp_otp_enabled', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMENT ON TABLE public.customer_phone_verification_challenges IS
  'Legacy customer provider challenges; inactive while Supabase phone OTP and Send SMS Hook are authoritative.';
