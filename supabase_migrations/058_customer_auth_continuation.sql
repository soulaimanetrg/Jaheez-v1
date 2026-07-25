-- Automatic customer auth continuation without exposing auth.users to clients.
-- Only HMAC hashes are persisted for enumeration controls.

CREATE TABLE IF NOT EXISTS public.customer_auth_continuation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash TEXT NOT NULL,
  device_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_auth_continuation_identifier_idx
  ON public.customer_auth_continuation_attempts(identifier_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_auth_continuation_device_idx
  ON public.customer_auth_continuation_attempts(device_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_auth_continuation_ip_idx
  ON public.customer_auth_continuation_attempts(ip_hash, created_at DESC);

ALTER TABLE public.customer_auth_continuation_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_auth_continuation_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.customer_auth_identifier_exists(
  p_identifier_type TEXT,
  p_identifier TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
  IF p_identifier_type = 'email' THEN
    RETURN EXISTS (
      SELECT 1 FROM auth.users
      WHERE lower(email) = lower(p_identifier)
    );
  ELSIF p_identifier_type = 'phone' THEN
    RETURN EXISTS (
      SELECT 1 FROM auth.users
      WHERE phone = p_identifier
    );
  END IF;
  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.customer_auth_identifier_exists(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_auth_identifier_exists(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_customer_auth_continuation_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE removed_count INTEGER;
BEGIN
  DELETE FROM public.customer_auth_continuation_attempts
  WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RETURN removed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_customer_auth_continuation_attempts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_customer_auth_continuation_attempts() TO service_role;
