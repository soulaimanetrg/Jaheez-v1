-- Production customer authentication: WhatsApp-first, social backups, no SMS/email OTP.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_provider_primary TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS first_order_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS legal_consent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_e164_active_unique
  ON public.users(phone_e164)
  WHERE phone_e164 IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.customer_phone_verification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_hash TEXT NOT NULL,
  nonce_hash TEXT NOT NULL UNIQUE,
  twilio_verification_sid TEXT,
  provider_status TEXT NOT NULL DEFAULT 'pending',
  purpose TEXT NOT NULL CHECK (purpose IN ('attach_phone','change_phone','step_up')),
  attempts INTEGER NOT NULL DEFAULT 0,
  resend_available_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  device_hash TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_phone_active_reservation_unique
  ON public.customer_phone_verification_challenges(phone_hash)
  WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS customer_phone_challenge_user_idx
  ON public.customer_phone_verification_challenges(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_phone_challenge_expiry_idx
  ON public.customer_phone_verification_challenges(expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.customer_phone_verification_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_phone_verification_challenges FROM anon, authenticated;

INSERT INTO public.app_settings(key,value) VALUES
  ('feature_customer_google_auth_enabled','true'),
  ('feature_customer_facebook_auth_enabled','false'),
  ('feature_customer_email_otp_enabled','false'),
  ('feature_customer_whatsapp_otp_enabled','false'),
  ('auth_whatsapp_trial_mode','true'),
  ('auth_whatsapp_trial_numbers','[]'),
  ('auth_sms_fallback_enabled','false'),
  ('customer_auth_legal_consent_version','2026-01')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Expired reservations must not block a new attempt. The backend calls this
-- before creating challenges; it is also safe to schedule periodically.
CREATE OR REPLACE FUNCTION public.cleanup_customer_phone_challenges()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected INTEGER;
BEGIN
  UPDATE public.customer_phone_verification_challenges
  SET consumed_at = now(), provider_status = 'expired'
  WHERE consumed_at IS NULL AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_customer_phone_challenges() FROM PUBLIC;
