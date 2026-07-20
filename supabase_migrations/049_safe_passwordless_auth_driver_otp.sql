-- Safe auth hardening: customer passwordless flags and driver OTP step-up.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS first_order_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auth_risk_level TEXT NOT NULL DEFAULT 'low'
    CHECK (auth_risk_level IN ('low','medium','high','blocked')),
  ADD COLUMN IF NOT EXISTS last_auth_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_contact_channel TEXT
    CHECK (preferred_contact_channel IS NULL OR preferred_contact_channel IN ('email','whatsapp','sms'));

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS driver_otp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS trusted_device_id TEXT,
  ADD COLUMN IF NOT EXISTS last_otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_challenge_nonce_hash TEXT,
  ADD COLUMN IF NOT EXISTS otp_challenge_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_last_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  code TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS code_hash TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'legacy_proof';

ALTER TABLE public.otp_codes
  ALTER COLUMN code DROP NOT NULL;

INSERT INTO public.app_settings(key,value)
VALUES
  ('feature_customer_google_auth_enabled','true'),
  ('feature_customer_facebook_auth_enabled','false'),
  ('feature_customer_email_otp_enabled','true'),
  ('feature_customer_whatsapp_otp_enabled','false'),
  ('feature_driver_otp_enabled','true'),
  ('auth_whatsapp_trial_mode','true'),
  ('auth_whatsapp_trial_numbers','[]'),
  ('auth_sms_fallback_enabled','false')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_auth_risk_level ON public.users(auth_risk_level);
CREATE INDEX IF NOT EXISTS idx_drivers_otp_locked_until ON public.drivers(otp_locked_until);

-- Authenticated customers can read their own profile. Sensitive writes remain
-- backend-only because the service role bypasses RLS.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own_profile ON public.users;
CREATE POLICY users_select_own_profile ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name, city, language, avatar_url, notification_enabled) ON public.users TO authenticated;

DROP POLICY IF EXISTS users_update_own_safe_profile ON public.users;
CREATE POLICY users_update_own_safe_profile ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
