-- ON CONFLICT(ref_id) requires a matching non-partial unique index.
DROP INDEX IF EXISTS public.idx_wallet_transaction_ref;
CREATE UNIQUE INDEX idx_wallet_transaction_ref
  ON public.wallet_transactions(ref_id);
