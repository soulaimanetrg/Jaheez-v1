-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 015 — Harden Database Row-Level Security on Wallets
-- Drop all client-side write/mutate policies on wallets and wallet_transactions.
-- Force all mutations to go through backend-authoritative services.
-- ═══════════════════════════════════════════════════════════════

-- 1. Hardening public.wallets RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_own_read" ON public.wallets;

CREATE POLICY "wallets_own_read"
ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Hardening public.wallet_transactions RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_tx_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_tx_own_read" ON public.wallet_transactions;

CREATE POLICY "wallet_tx_own_read"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);
