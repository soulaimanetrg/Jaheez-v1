-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 009 — OTP codes table (replaces in-memory Map)
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- OTP codes table: stores one-time passwords for phone verification.
-- Replaces the previous in-memory Map which was lost on server restart
-- and didn't support multi-instance deployments.
CREATE TABLE IF NOT EXISTS public.otp_codes (
  phone       TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: only service_role should access this table (backend uses service_role key).
-- No user should be able to read OTP codes directly.
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no direct client access. Only service_role (which bypasses RLS) can read/write.

-- Auto-cleanup: expired OTPs are cleaned up by the application on access.
-- Optional: set up a Supabase cron job to purge expired rows daily:
-- SELECT cron.schedule('cleanup-expired-otps', '0 3 * * *', $$
--   DELETE FROM public.otp_codes WHERE expires_at < NOW();
-- $$);
