create or replace function public.change_my_reservation_status(
  p_reservation_id uuid,
  p_new_status public.reservation_status
)
returns table (
  id uuid,
  status public.reservation_status,
  contact_visible boolean,
  contact_visible_after_payment boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  return query
  update public.reservations r
  set
    status = p_new_status,
    updated_at = now()
  where r.id = p_reservation_id
    and (
      r.owner_id = auth.uid()
      or r.renter_id = auth.uid()
    )
  returning
    r.id,
    r.status,
    r.contact_visible,
    r.contact_visible_after_payment,
    r.updated_at;

  if not found then
    raise exception 'Reservation does not exist or user is not related to it';
  end if;
end;
$function$;

revoke all on function public.change_my_reservation_status(uuid, public.reservation_status) from public;
revoke all on function public.change_my_reservation_status(uuid, public.reservation_status) from anon;
revoke all on function public.change_my_reservation_status(uuid, public.reservation_status) from authenticated;

grant execute on function public.change_my_reservation_status(uuid, public.reservation_status) to authenticated;