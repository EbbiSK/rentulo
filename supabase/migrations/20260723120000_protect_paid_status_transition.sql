create or replace function public.protect_reservation_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = old.status then
    return new;
  end if;

  if auth.uid() = old.owner_id then
    if
      (old.status = 'pending' and new.status in ('approved', 'rejected'))
      or (old.status = 'paid' and new.status = 'picked_up')
      or (old.status = 'picked_up' and new.status = 'returned')
    then
      return new;
    end if;

    raise exception
      'Owner is not allowed to change reservation status from % to %',
      old.status,
      new.status;
  end if;

  if auth.uid() = old.renter_id then
    if
      (
        old.status in ('pending', 'approved')
        and new.status = 'cancelled'
      )
    then
      return new;
    end if;

    if
      old.status = 'approved'
      and new.status = 'paid'
      and current_setting(
        'app.test_payment_authorized',
        true
      ) = 'on'
      and exists (
        select 1
        from public.test_payment_users t
        where t.user_id = auth.uid()
      )
    then
      return new;
    end if;

    raise exception
      'Renter is not allowed to change reservation status from % to %',
      old.status,
      new.status;
  end if;

  raise exception 'User is not related to this reservation';
end;
$function$;

create or replace function public.mark_my_reservation_paid_test(
  p_reservation_id uuid
)
returns table (
  id uuid,
  status public.reservation_status,
  contact_visible boolean,
  contact_visible_after_payment boolean,
  paid_at timestamptz,
  payment_provider_status text,
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

  if not exists (
    select 1
    from public.test_payment_users t
    where t.user_id = auth.uid()
  ) then
    raise exception 'Test payment is disabled for this account';
  end if;

  perform set_config(
    'app.test_payment_authorized',
    'on',
    true
  );

  return query
  update public.reservations r
  set
    status = 'paid',
    paid_at = now(),
    payment_provider_status = 'paid_test',
    updated_at = now()
  where r.id = p_reservation_id
    and r.renter_id = auth.uid()
    and r.status = 'approved'
  returning
    r.id,
    r.status,
    r.contact_visible,
    r.contact_visible_after_payment,
    r.paid_at,
    r.payment_provider_status,
    r.updated_at;

  perform set_config(
    'app.test_payment_authorized',
    'off',
    true
  );

  if not found then
    raise exception
      'Reservation is not approved, does not exist, or user is not its renter';
  end if;
end;
$function$;

revoke all
on function public.protect_reservation_status_transition()
from public, anon, authenticated;

revoke all
on function public.mark_my_reservation_paid_test(uuid)
from public, anon, authenticated;

grant execute
on function public.mark_my_reservation_paid_test(uuid)
to authenticated;