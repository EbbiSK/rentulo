create or replace function public.get_blocking_reservations(
  p_offer_id uuid default null
)
returns table (
  id uuid,
  offer_id uuid,
  status public.reservation_status,
  start_date date,
  end_date date
)
language sql
security definer
set search_path = public
stable
as $function$
  select
    r.id,
    r.offer_id,
    r.status,
    r.start_date,
    r.end_date
  from public.reservations r
  where r.status in ('pending', 'approved', 'paid', 'picked_up')
    and (
      p_offer_id is null
      or r.offer_id = p_offer_id
    );
$function$;

revoke all on function public.get_blocking_reservations(uuid) from public;
revoke all on function public.get_blocking_reservations(uuid) from anon;
revoke all on function public.get_blocking_reservations(uuid) from authenticated;

grant execute on function public.get_blocking_reservations(uuid) to anon;
grant execute on function public.get_blocking_reservations(uuid) to authenticated;