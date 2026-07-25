-- Secure customer enrollment challenge state.
-- Identifiers and OTP values are never stored in plaintext.

CREATE TABLE IF NOT EXISTS public.customer_registration_challenges (
  id UUID PRIMARY KEY,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'phone')),
  identifier_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  proof_hash TEXT,
  provider_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (provider_status IN ('pending', 'sent', 'verified', 'failed', 'consumed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  resend_available_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  device_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_registration_identifier_created_idx
  ON public.customer_registration_challenges(identifier_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_registration_device_created_idx
  ON public.customer_registration_challenges(device_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_registration_ip_created_idx
  ON public.customer_registration_challenges(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_registration_expiry_idx
  ON public.customer_registration_challenges(expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.customer_registration_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_registration_challenges FROM anon, authenticated;

INSERT INTO public.app_settings(key, value) VALUES
  ('feature_customer_email_otp_enabled', 'false'),
  ('feature_customer_whatsapp_otp_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_customer_registration_code(
  p_challenge_id UUID,
  p_code_hash TEXT,
  p_proof_hash TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE challenge public.customer_registration_challenges%ROWTYPE;
DECLARE next_attempts INTEGER;
BEGIN
  SELECT * INTO challenge
  FROM public.customer_registration_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND OR challenge.consumed_at IS NOT NULL OR challenge.verified_at IS NOT NULL
    OR challenge.expires_at <= now() OR challenge.provider_status <> 'sent'
    OR challenge.attempts >= 5 OR (challenge.locked_until IS NOT NULL AND challenge.locked_until > now()) THEN
    RETURN 'invalid';
  END IF;

  IF challenge.code_hash <> p_code_hash THEN
    next_attempts := challenge.attempts + 1;
    UPDATE public.customer_registration_challenges
    SET attempts = next_attempts,
        locked_until = CASE WHEN next_attempts >= 5 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE id = p_challenge_id;
    RETURN 'invalid';
  END IF;

  UPDATE public.customer_registration_challenges
  SET proof_hash = p_proof_hash,
      provider_status = 'verified',
      verified_at = now(),
      code_hash = ''
  WHERE id = p_challenge_id;
  RETURN 'verified';
END;
$$;

REVOKE ALL ON FUNCTION public.verify_customer_registration_code(UUID, TEXT, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.prepare_customer_registration_resend(
  p_challenge_id UUID,
  p_code_hash TEXT,
  p_resend_available_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated_count INTEGER;
BEGIN
  UPDATE public.customer_registration_challenges
  SET code_hash = p_code_hash,
      attempts = 0,
      locked_until = NULL,
      provider_status = 'pending',
      resend_available_at = p_resend_available_at
  WHERE id = p_challenge_id
    AND verified_at IS NULL
    AND consumed_at IS NULL
    AND expires_at > now()
    AND resend_available_at <= now();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_customer_registration_resend(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.consume_customer_registration_challenge(
  p_challenge_id UUID,
  p_proof_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE consumed_count INTEGER;
BEGIN
  UPDATE public.customer_registration_challenges
  SET consumed_at = now(), provider_status = 'consumed', code_hash = '', proof_hash = NULL
  WHERE id = p_challenge_id
    AND proof_hash = p_proof_hash
    AND verified_at IS NOT NULL
    AND consumed_at IS NULL
    AND expires_at > now();
  GET DIAGNOSTICS consumed_count = ROW_COUNT;
  RETURN consumed_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_customer_registration_challenge(UUID, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.cleanup_customer_registration_challenges()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE removed_count INTEGER;
BEGIN
  DELETE FROM public.customer_registration_challenges
  WHERE expires_at < now() - interval '24 hours'
     OR consumed_at < now() - interval '24 hours';
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RETURN removed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_customer_registration_challenges() FROM PUBLIC;
