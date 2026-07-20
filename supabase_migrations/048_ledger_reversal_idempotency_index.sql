DROP INDEX IF EXISTS public.idx_ledger_single_reversal;
CREATE UNIQUE INDEX idx_ledger_single_reversal
  ON public.driver_earnings_ledger(reversed_ledger_entry_id);
