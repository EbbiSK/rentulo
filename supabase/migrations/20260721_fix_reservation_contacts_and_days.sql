create or replace function public.prepare_reservation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_offer public.offers%rowtype;
  v_owner_profile public.profiles%rowtype;
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

  select *
  into v_owner_profile
  from public.profiles
  where id = v_offer.owner_id;

  new.owner_id := v_offer.owner_id;
  new.renter_id := auth.uid();

  -- Datum vraceni je konec vypujcky: 22. 7. az 23. 7. = 1 den.
  new.days := greatest(1, new.end_date - new.start_date);
  new.total_days := new.days;

  new.price_per_day := v_offer.price_per_day;
  new.deposit := 0;
  new.total_price := new.days * new.price_per_day;
  new.platform_fee_percent := 10;
  new.platform_fee_amount :=
    round(new.total_price * new.platform_fee_percent / 100.0)::integer;
  new.owner_payout := new.total_price - new.platform_fee_amount;

  new.offer_name := v_offer.name;
  new.category := v_offer.category;
  new.city := v_offer.city;

  new.owner_name := coalesce(nullif(v_owner_profile.full_name, ''), 'Majitel');
  new.owner_email := coalesce(v_owner_profile.email, '');
  new.owner_phone := coalesce(v_owner_profile.phone, '');

  new.pickup_phone := coalesce(nullif(v_offer.pickup_phone, ''), v_owner_profile.phone, '');
  new.pickup_street := coalesce(nullif(v_offer.pickup_street, ''), v_owner_profile.street, '');
  new.pickup_city := coalesce(nullif(v_offer.pickup_city, ''), v_offer.city, '');
  new.pickup_postal_code := coalesce(nullif(v_offer.pickup_postal_code, ''), v_owner_profile.postal_code, '');
  new.pickup_note := coalesce(v_offer.pickup_note, '');

  new.status := 'pending';
  new.contact_visible := false;
  new.contact_visible_after_payment := false;

  return new;
end;
$function$;

drop trigger if exists prepare_reservation_before_insert
on public.reservations;

create trigger prepare_reservation_before_insert
before insert on public.reservations
for each row
execute function public.prepare_reservation_insert();
