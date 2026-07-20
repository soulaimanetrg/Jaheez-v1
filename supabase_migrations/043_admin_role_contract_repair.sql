-- Align the database role constraint with the backend authorization contract.
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE public.admins ADD CONSTRAINT admins_role_check CHECK (role IN (
  'super_admin', 'operations', 'finance', 'support', 'content_manager',
  'admin', 'manager'
));
