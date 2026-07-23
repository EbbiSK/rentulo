create or replace function public.mark_my_reservation_paid_test(
  p_reservation_id uuid
)
returns table(
  id uuid,
  status public.reservation_status,
  contact_visible boolean,
  contact_visible_after_payment boolean,
  paid_at timestamp with time zone,
  payment_provider_status text,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_updated_rows integer;
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

  get diagnostics v_updated_rows = row_count;

  perform set_config(
    'app.test_payment_authorized',
    'off',
    true
  );

  if v_updated_rows = 0 then
    raise exception
      'Reservation is not approved, does not exist, or user is not its renter';
  end if;
end;
$function$;
