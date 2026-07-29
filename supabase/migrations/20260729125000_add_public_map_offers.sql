create or replace function public.get_public_map_offers()
returns table (
  id uuid,
  owner_id uuid,
  name text,
  city text,
  price_per_day integer,
  photo_url text,
  created_at timestamptz,
  map_latitude double precision,
  map_longitude double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.owner_id,
    o.name,
    o.city,
    o.price_per_day,
    o.photo_url,
    o.created_at,
    round(o.pickup_latitude::numeric, 2)::double precision as map_latitude,
    round(o.pickup_longitude::numeric, 2)::double precision as map_longitude
  from public.offers as o
  where o.status = 'active'::public.offer_status
    and o.pickup_latitude is not null
    and o.pickup_longitude is not null;
$$;

revoke all on function public.get_public_map_offers() from public;
grant execute on function public.get_public_map_offers() to anon, authenticated;
