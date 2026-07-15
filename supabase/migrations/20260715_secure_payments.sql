create or replace function public.prepare_payment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = new.reservation_id;

  if not found then
    raise exception 'Reservation does not exist';
  end if;

  if auth.uid() <> v_reservation.renter_id then
    raise exception 'Only the renter can create a payment';
  end if;

  if v_reservation.status <> 'approved' then
    raise exception 'Payment can be created only for an approved reservation';
  end if;

  new.payer_id := v_reservation.renter_id;
  new.owner_id := v_reservation.owner_id;
  new.amount_total := v_reservation.total_price;
  new.platform_fee_amount := v_reservation.platform_fee_amount;
  new.owner_payout := v_reservation.owner_payout;
  new.status := 'pending';
  new.paid_at := null;

  return new;
end;
$function$;

drop trigger if exists prepare_payment_before_insert
on public.payments;

create trigger prepare_payment_before_insert
before insert on public.payments
for each row
execute function public.prepare_payment_insert();

drop policy if exists payments_update_related
on public.payments;

revoke update
on public.payments
from anon, authenticated;
