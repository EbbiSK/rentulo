alter table public.reservations
  add column if not exists pickup_latitude double precision,
  add column if not exists pickup_longitude double precision;


create or replace function public.fill_reservation_pickup_data()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  offer_row public.offers%rowtype;
begin
  select *
  into offer_row
  from public.offers
  where id = new.offer_id;

  if found then
    new.pickup_phone := coalesce(
      nullif(new.pickup_phone, ''),
      offer_row.pickup_phone
    );

    new.owner_phone := coalesce(
      nullif(new.owner_phone, ''),
      offer_row.pickup_phone
    );

    new.pickup_street := coalesce(
      nullif(new.pickup_street, ''),
      offer_row.pickup_street
    );

    new.pickup_city := coalesce(
      nullif(new.pickup_city, ''),
      offer_row.pickup_city,
      offer_row.city
    );

    new.pickup_postal_code := coalesce(
      nullif(new.pickup_postal_code, ''),
      offer_row.pickup_postal_code,
      offer_row.postal_code
    );

    new.pickup_note := coalesce(
      nullif(new.pickup_note, ''),
      offer_row.pickup_note
    );

    new.pickup_full_address := nullif(
      concat_ws(
        ', ',
        nullif(new.pickup_street, ''),
        nullif(new.pickup_city, ''),
        nullif(new.pickup_postal_code, '')
      ),
      ''
    );

    new.pickup_latitude := coalesce(
      new.pickup_latitude,
      offer_row.pickup_latitude
    );

    new.pickup_longitude := coalesce(
      new.pickup_longitude,
      offer_row.pickup_longitude
    );
  end if;

  return new;
end;
$function$;


create or replace function public.protect_reservation_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_payment_update_authorized boolean;
begin
  v_payment_update_authorized :=
    (
      old.status = 'approved'
      and new.status = 'paid'
      and (
        current_setting('app.test_payment_authorized', true) = 'on'
        or current_setting('app.payment_update_authorized', true) = 'on'
      )
    );

  if new.id is distinct from old.id
     or new.offer_id is distinct from old.offer_id
     or new.owner_id is distinct from old.owner_id
     or new.renter_id is distinct from old.renter_id
     or new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date
     or new.date_from is distinct from old.date_from
     or new.date_to is distinct from old.date_to
     or new.days is distinct from old.days
     or new.price_per_day is distinct from old.price_per_day
     or new.total_price is distinct from old.total_price
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
     or new.owner_phone is distinct from old.owner_phone
     or new.pickup_phone is distinct from old.pickup_phone
     or new.pickup_street is distinct from old.pickup_street
     or new.pickup_city is distinct from old.pickup_city
     or new.pickup_postal_code is distinct from old.pickup_postal_code
     or new.pickup_full_address is distinct from old.pickup_full_address
     or new.pickup_note is distinct from old.pickup_note
     or new.pickup_latitude is distinct from old.pickup_latitude
     or new.pickup_longitude is distinct from old.pickup_longitude
     or (
       not v_payment_update_authorized
       and (
         new.paid_at is distinct from old.paid_at
         or new.payment_provider_status
              is distinct from old.payment_provider_status
       )
     )
  then
    raise exception 'Immutable reservation fields cannot be changed';
  end if;

  return new;
end;
$function$;