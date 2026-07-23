create or replace function public.get_blocked_offer_ids()
returns table (
  offer_id uuid
)
language sql
stable
security definer
set search_path = public
as $function$
  select distinct
    r.offer_id
  from public.reservations r
  where r.status in (
    'pending',
    'approved',
    'paid',
    'picked_up'
  );
$function$;

revoke all
on function public.get_blocked_offer_ids()
from public;

revoke all
on function public.get_blocked_offer_ids()
from anon;

revoke all
on function public.get_blocked_offer_ids()
from authenticated;

grant execute
on function public.get_blocked_offer_ids()
to anon;

grant execute
on function public.get_blocked_offer_ids()
to authenticated;

comment on function public.get_blocked_offer_ids()
is 'Returns only distinct offer IDs with blocking reservations. Does not expose reservation IDs, statuses, dates, or user data.';
