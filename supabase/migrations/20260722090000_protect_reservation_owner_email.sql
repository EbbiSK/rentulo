create or replace function public.protect_reservation_immutable_fields()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if new.id is distinct from old.id
    or new.offer_id is distinct from old.offer_id
    or new.owner_id is distinct from old.owner_id
    or new.renter_id is distinct from old.renter_id
    or new.start_date is distinct from old.start_date
    or new.end_date is distinct from old.end_date
    or new.days is distinct from old.days
    or new.price_per_day is distinct from old.price_per_day
    or new.total_price is distinct from old.total_price
    or new.deposit is distinct from old.deposit
    or new.platform_fee_percent is distinct from old.platform_fee_percent
    or new.platform_fee_amount is distinct from old.platform_fee_amount
    or new.owner_payout is distinct from old.owner_payout
    or new.created_at is distinct from old.created_at
    or new.offer_name is distinct from old.offer_name
    or new.category is distinct from old.category
    or new.city is distinct from old.city
    or new.total_days is distinct from old.total_days
    or new.renter_name is distinct from old.renter_name
    or new.renter_email is distinct from old.renter_email
    or new.renter_phone is distinct from old.renter_phone
    or new.owner_name is distinct from old.owner_name
    or new.owner_email is distinct from old.owner_email
    or new.owner_phone is distinct from old.owner_phone
    or new.pickup_phone is distinct from old.pickup_phone
    or new.pickup_street is distinct from old.pickup_street
    or new.pickup_city is distinct from old.pickup_city
    or new.pickup_postal_code is distinct from old.pickup_postal_code
    or new.pickup_full_address is distinct from old.pickup_full_address
    or new.pickup_note is distinct from old.pickup_note
  then
    raise exception 'Immutable reservation fields cannot be changed';
  end if;

  return new;
end;
$function$;

revoke all on function public.protect_reservation_immutable_fields() from public;
revoke all on function public.protect_reservation_immutable_fields() from anon;
revoke all on function public.protect_reservation_immutable_fields() from authenticated;
