drop view if exists public.public_offers;

drop function if exists public.get_my_reservations();

create function public.get_my_reservations()
returns table (
  id uuid,
  offer_id uuid,
  owner_id uuid,
  renter_id uuid,
  start_date date,
  end_date date,
  days integer,
  price_per_day integer,
  total_price integer,
  platform_fee_percent integer,
  platform_fee_amount integer,
  owner_payout integer,
  status public.reservation_status,
  contact_visible boolean,
  created_at timestamptz,
  updated_at timestamptz,
  offer_name text,
  category text,
  city text,
  total_days integer,
  renter_name text,
  renter_email text,
  renter_phone text,
  owner_name text,
  contact_visible_after_payment boolean,
  date_from date,
  date_to date,
  paid_at timestamptz,
  payment_provider_status text,
  owner_phone text,
  pickup_phone text,
  pickup_street text,
  pickup_city text,
  pickup_postal_code text,
  pickup_full_address text,
  pickup_note text
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    r.id,
    r.offer_id,
    r.owner_id,
    r.renter_id,
    r.start_date,
    r.end_date,
    r.days,
    r.price_per_day,
    r.total_price,
    r.platform_fee_percent,
    r.platform_fee_amount,
    r.owner_payout,
    r.status,

    r.status in ('paid', 'picked_up', 'returned')
      as contact_visible,

    r.created_at,
    r.updated_at,
    r.offer_name,
    r.category,
    r.city,
    r.total_days,
    r.renter_name,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.renter_email
      else null
    end as renter_email,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.renter_phone
      else null
    end as renter_phone,

    r.owner_name,

    r.status in ('paid', 'picked_up', 'returned')
      as contact_visible_after_payment,

    r.date_from,
    r.date_to,
    r.paid_at,
    r.payment_provider_status,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.owner_phone
      else null
    end as owner_phone,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_phone
      else null
    end as pickup_phone,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_street
      else null
    end as pickup_street,

    r.pickup_city,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_postal_code
      else null
    end as pickup_postal_code,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_full_address
      else null
    end as pickup_full_address,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_note
      else null
    end as pickup_note

  from public.reservations r
  where auth.uid() is not null
    and (
      r.owner_id = auth.uid()
      or r.renter_id = auth.uid()
    )
  order by r.created_at desc;
$function$;

alter function public.get_my_reservations()
owner to postgres;

revoke all on function public.get_my_reservations() from public;
revoke all on function public.get_my_reservations() from anon;
grant execute on function public.get_my_reservations() to authenticated;

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

  new.owner_id := v_offer.owner_id;
  new.renter_id := auth.uid();

  new.days := greatest(1, new.end_date - new.start_date);
  new.total_days := new.days;

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

  return new;
end;
$function$;

create or replace function public.protect_reservation_immutable_fields()
returns trigger
language plpgsql
security definer
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
  then
    raise exception 'Immutable reservation fields cannot be changed';
  end if;

  return new;
end;
$function$;

alter table public.offers
drop column deposit;

alter table public.reservations
drop column deposit;

create view public.public_offers
with (security_invoker = true)
as
select
  id,
  owner_id,
  name,
  category,
  description,
  city,
  postal_code,
  price_per_day,
  status,
  photo_url,
  pickup_mode,
  created_at,
  updated_at
from public.offers
where status = 'active'::public.offer_status;

grant select on public.public_offers to anon, authenticated;
