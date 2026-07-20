-- Repair legacy refunds tables that predated the audited finance contract.
ALTER TABLE public.refunds
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS user_phone TEXT,
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT,
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requested_by_email TEXT,
  ADD COLUMN IF NOT EXISTS processed_by_email TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_note TEXT;

UPDATE public.refunds SET method='wallet' WHERE method IS NULL;
UPDATE public.refunds SET status='denied' WHERE status='rejected';
UPDATE public.refunds SET status='completed' WHERE status='refunded';
UPDATE public.refunds SET updated_at=NOW() WHERE updated_at IS NULL;

ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_status_check;
ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_method_check;
ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_amount_positive_check;
ALTER TABLE public.refunds
  ALTER COLUMN method SET NOT NULL,
  ALTER COLUMN reason SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  ADD CONSTRAINT refunds_status_check CHECK (status IN ('pending','approved','denied','processing','completed','failed')),
  ADD CONSTRAINT refunds_method_check CHECK (method IN ('wallet','cash','gateway')),
  ADD CONSTRAINT refunds_amount_positive_check CHECK (amount_centimes > 0);

CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status,created_at DESC);
