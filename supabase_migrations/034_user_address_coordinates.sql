-- Store customer address coordinates for precise driver navigation.
-- Text addresses are still kept for display; lat/lng are nullable for legacy/manual addresses.

alter table if exists public.user_addresses
  add column if not exists lat numeric,
  add column if not exists lng numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_addresses_lat_range'
      and conrelid = 'public.user_addresses'::regclass
  ) then
    alter table public.user_addresses
      add constraint user_addresses_lat_range
      check (lat is null or (lat >= -90 and lat <= 90));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_addresses_lng_range'
      and conrelid = 'public.user_addresses'::regclass
  ) then
    alter table public.user_addresses
      add constraint user_addresses_lng_range
      check (lng is null or (lng >= -180 and lng <= 180));
  end if;
end $$;

create index if not exists idx_user_addresses_user_default
  on public.user_addresses(user_id, is_default);
