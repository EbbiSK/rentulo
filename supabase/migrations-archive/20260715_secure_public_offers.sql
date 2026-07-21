drop policy if exists offers_select_public_active
on public.offers;

drop view if exists public.public_offers;

create view public.public_offers
with (security_invoker = false)
as
select
  id,
  owner_id,
  name,
  category,
  description,
  city,
  postal_code,
  price_per_day,
  deposit,
  status,
  photo_url,
  pickup_mode,
  created_at,
  updated_at
from public.offers
where status = 'active';

revoke all on public.public_offers from public;
grant select on public.public_offers to anon, authenticated;
