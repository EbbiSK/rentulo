-- Derive renter contact data and duplicate date fields on the server.
create or replace function public.prepare_reservation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_offer public.offers%rowtype;
  v_owner_profile public.profiles%rowtype;
  v_renter_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_offer
  from public.offers
  where id = new.offer_id;

  if not found then
    raise exception 'Offer does not exist';
  end if;

  if v_offer.status <> 'active' then
    raise exception 'Offer is not active';
  end if;

  if v_offer.owner_id = auth.uid() then
    raise exception 'Owner cannot reserve own offer';
  end if;

  if new.start_date is null
     or new.end_date is null
     or new.end_date <= new.start_date then
    raise exception 'Invalid reservation dates';
  end if;

  perform pg_advisory_xact_lock(hashtext(new.offer_id::text));

  if exists (
    select 1
    from public.reservations existing
    where existing.offer_id = new.offer_id
      and existing.status::text in (
        'pending',
        'approved',
        'paid',
        'picked_up'
      )
      and new.start_date < existing.end_date
      and new.end_date > existing.start_date
  ) then
    raise exception
      'Selected reservation dates overlap an existing reservation';
  end if;

  select *
  into v_owner_profile
  from public.profiles
  where id = v_offer.owner_id;

  select *
  into v_renter_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'Renter profile does not exist';
  end if;

  new.owner_id := v_offer.owner_id;
  new.renter_id := auth.uid();

  new.days := greatest(1, new.end_date - new.start_date);
  new.total_days := new.days;
  new.date_from := new.start_date;
  new.date_to := new.end_date;

  new.price_per_day := v_offer.price_per_day;
  new.total_price := new.days * new.price_per_day;
  new.platform_fee_percent := 10;
  new.platform_fee_amount :=
    round(new.total_price * new.platform_fee_percent / 100.0)::integer;
  new.owner_payout :=
    new.total_price - new.platform_fee_amount;

  new.offer_name := v_offer.name;
  new.category := v_offer.category;
  new.city := v_offer.city;

  new.renter_name :=
    coalesce(nullif(v_renter_profile.full_name, ''), 'Nájemce');

  new.renter_email :=
    coalesce(v_renter_profile.email, '');

  new.renter_phone :=
    coalesce(v_renter_profile.phone, '');

  new.owner_name :=
    coalesce(nullif(v_owner_profile.full_name, ''), 'Majitel');

  new.owner_phone :=
    coalesce(v_owner_profile.phone, '');

  new.pickup_phone :=
    coalesce(
      nullif(v_offer.pickup_phone, ''),
      v_owner_profile.phone,
      ''
    );

  new.pickup_street :=
    coalesce(
      nullif(v_offer.pickup_street, ''),
      v_owner_profile.street,
      ''
    );

  new.pickup_city :=
    coalesce(
      nullif(v_offer.pickup_city, ''),
      v_offer.city,
      ''
    );

  new.pickup_postal_code :=
    coalesce(
      nullif(v_offer.pickup_postal_code, ''),
      v_owner_profile.postal_code,
      ''
    );

  new.pickup_note :=
    coalesce(v_offer.pickup_note, '');

  new.status := 'pending'::public.reservation_status;
  new.contact_visible := false;
  new.contact_visible_after_payment := false;
  new.paid_at := null;
  new.payment_provider_status := null;

  return new;
end;
$function$;


-- Protect all reservation snapshot fields from direct client updates.
create or replace function public.protect_reservation_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
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