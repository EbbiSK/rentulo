begin;

drop function public.get_blocking_reservations(uuid);

create function public.get_blocking_reservations(
  p_offer_id uuid
)
returns table (
  id uuid,
  offer_id uuid,
  status public.reservation_status,
  start_date date,
  end_date date
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    r.id,
    r.offer_id,
    r.status,
    r.start_date,
    r.end_date
  from public.reservations r
  where p_offer_id is not null
    and r.offer_id = p_offer_id
    and r.status in (
      'pending',
      'approved',
      'paid',
      'picked_up'
    );
$function$;

revoke all
on function public.get_blocking_reservations(uuid)
from public;

revoke all
on function public.get_blocking_reservations(uuid)
from anon;

revoke all
on function public.get_blocking_reservations(uuid)
from authenticated;

grant execute
on function public.get_blocking_reservations(uuid)
to anon;

grant execute
on function public.get_blocking_reservations(uuid)
to authenticated;

comment on function public.get_blocking_reservations(uuid)
is 'Returns blocking reservations only for one explicitly supplied offer ID. NULL returns no rows.';

commit;
