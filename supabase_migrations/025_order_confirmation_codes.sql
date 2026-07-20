-- Order pickup/delivery confirmation codes.
-- Drivers must submit these codes before marking picked_up/delivered.

alter table public.orders
  add column if not exists pickup_confirmation_code text,
  add column if not exists delivery_confirmation_code text,
  add column if not exists pickup_confirmed_at timestamptz,
  add column if not exists delivery_confirmed_at timestamptz;

create index if not exists idx_orders_pickup_confirmation_pending
  on public.orders (id)
  where pickup_confirmation_code is not null and pickup_confirmed_at is null;

create index if not exists idx_orders_delivery_confirmation_pending
  on public.orders (id)
  where delivery_confirmation_code is not null and delivery_confirmed_at is null;
