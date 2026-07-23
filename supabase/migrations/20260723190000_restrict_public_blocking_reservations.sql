drop function if exists public.get_blocking_reservations(uuid);

create function public.get_blocking_reservations(p_offer_id uuid)
returns table (
  start_date date,
  end_date date
)
language sql
stable
security definer
set search_path = public
as $function$
  select
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
    )
  order by r.start_date;
$function$;

alter function public.get_blocking_reservations(uuid)
owner to postgres;

revoke all
on function public.get_blocking_reservations(uuid)
from public;

grant execute
on function public.get_blocking_reservations(uuid)
to anon, authenticated;