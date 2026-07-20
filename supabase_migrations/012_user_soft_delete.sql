-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 012 — User soft-delete + 30-day PII purge
-- Spec 2.3.7. Run AFTER 011.x in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 012.1 — deleted_at column on public.users (soft-delete marker)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_deleted_at_idx
  ON public.users (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- 012.2 — purge_deleted_users()
-- Fully nulls / removes residual PII for users soft-deleted more than
-- 30 days ago. Runs as the wallet/auth pipeline DOES NOT depend on the
-- user row being physically removed (foreign keys to orders, wallets,
-- support tickets etc. must still resolve), so this purge nulls PII
-- but keeps the row + the auth.users row for referential integrity.
--
-- Schedule via Supabase pg_cron (preferred) once per day:
--   SELECT cron.schedule('purge_deleted_users_daily', '0 3 * * *',
--                        $$ SELECT public.purge_deleted_users(); $$);
-- Or trigger from any external scheduler hitting an admin RPC route.
CREATE OR REPLACE FUNCTION public.purge_deleted_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER := 0;
  victim   RECORD;
BEGIN
  FOR victim IN
    SELECT id FROM public.users
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (now() - interval '30 days')
      AND (full_name IS NULL OR full_name = '')
      AND (email     IS NULL)
      -- Re-purge only rows that still have residual PII to clean.
      AND EXISTS (
        SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = users.id
        UNION ALL
        SELECT 1 FROM public.users u
        WHERE u.id = users.id AND (u.push_token IS NOT NULL OR u.avatar_url IS NOT NULL)
      )
  LOOP
    DELETE FROM public.user_addresses WHERE user_id = victim.id;
    UPDATE public.users
       SET avatar_url = NULL,
           push_token = NULL,
           updated_at = now()
     WHERE id = victim.id;
    affected := affected + 1;
  END LOOP;

  RETURN affected;
END;
$$;

REVOKE ALL    ON FUNCTION public.purge_deleted_users() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.purge_deleted_users() TO service_role;
