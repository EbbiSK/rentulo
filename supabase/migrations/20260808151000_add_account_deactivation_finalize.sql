-- Server-only account deactivation finalizer and reservation/deactivation race guard.
-- This migration does not deactivate any account by itself.
-- The finalizer can be executed only by service_role from trusted server-side code.

begin;

-- Keep reservation creation and account deactivation serialized per user.
-- This prevents a new reservation from appearing between the final eligibility
-- check and the account being deactivated.
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
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_offer
  from public.offers
  where id = new.offer_id;

  if not found then
    raise exception 'Offer does not exist';
  end if;

  -- Always acquire account locks in the same order to avoid deadlocks when
  -- two users are interacting with each other's offers at the same time.
  if v_offer.owner_id::text < v_current_user_id::text then
    perform pg_advisory_xact_lock(860808, hashtext(v_offer.owner_id::text));
    perform pg_advisory_xact_lock(860808, hashtext(v_current_user_id::text));
  else
    perform pg_advisory_xact_lock(860808, hashtext(v_current_user_id::text));
    perform pg_advisory_xact_lock(860808, hashtext(v_offer.owner_id::text));
  end if;

  -- Re-read the offer after the account locks have been acquired. If the owner
  -- was deactivated while this request was waiting, the offer is now deleted.
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

  if v_offer.owner_id = v_current_user_id then
    raise exception 'Owner cannot reserve own offer';
  end if;

  select *
  into v_owner_profile
  from public.profiles
  where id = v_offer.owner_id
    and account_status = 'active';

  if not found then
    raise exception 'Owner account is not active';
  end if;

  select *
  into v_renter_profile
  from public.profiles
  where id = v_current_user_id
    and account_status = 'active';

  if not found then
    raise exception 'Renter account is not active';
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

  new.owner_id := v_offer.owner_id;
  new.renter_id := v_current_user_id;

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

-- Trusted finalizer used only by the account-deactivation Edge Function.
-- It re-checks active reservations inside the same database transaction,
-- soft-deletes the user's offers and marks the profile as deactivated.
create or replace function public.finalize_account_deactivation(target_user_id uuid)
returns table (
  account_status text,
  closed_offers_count bigint,
  deactivated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_account_status text;
  v_existing_deactivated_at timestamptz;
  v_blocking_count bigint := 0;
  v_closed_offers_count bigint := 0;
  v_deactivated_at timestamptz;
begin
  if target_user_id is null then
    raise exception 'Target user is required'
      using errcode = '22023';
  end if;

  -- Same namespace/key as prepare_reservation_insert(). A reservation creation
  -- involving this user must either finish before this lock or wait until this
  -- transaction commits and then fail because the account/offer is inactive.
  perform pg_advisory_xact_lock(860808, hashtext(target_user_id::text));

  select p.account_status, p.deactivated_at
    into v_account_status, v_existing_deactivated_at
  from public.profiles p
  where p.id = target_user_id
  for update;

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  -- Idempotent retry: a server retry after a partial network failure is safe.
  if v_account_status = 'deactivated' then
    return query
    select
      v_account_status,
      0::bigint,
      v_existing_deactivated_at;
    return;
  end if;

  select count(*)
    into v_blocking_count
  from public.reservations r
  where (
      r.owner_id = target_user_id
      or r.renter_id = target_user_id
    )
    and r.status in (
      'pending'::public.reservation_status,
      'approved'::public.reservation_status,
      'paid'::public.reservation_status,
      'picked_up'::public.reservation_status
    );

  if v_blocking_count > 0 then
    raise exception 'Account has active reservations'
      using
        errcode = 'P0001',
        detail = 'blocking_reservations=' || v_blocking_count::text;
  end if;

  update public.offers o
  set
    status = 'deleted'::public.offer_status,
    updated_at = now()
  where o.owner_id = target_user_id
    and o.status <> 'deleted'::public.offer_status;

  get diagnostics v_closed_offers_count = row_count;

  v_deactivated_at := now();

  update public.profiles p
  set
    account_status = 'deactivated',
    deactivation_requested_at = coalesce(p.deactivation_requested_at, v_deactivated_at),
    deactivated_at = v_deactivated_at,
    updated_at = v_deactivated_at
  where p.id = target_user_id;

  return query
  select
    'deactivated'::text,
    v_closed_offers_count,
    v_deactivated_at;
end;
$function$;

revoke all
on function public.finalize_account_deactivation(uuid)
from public, anon, authenticated;

grant execute
on function public.finalize_account_deactivation(uuid)
to service_role;

comment on function public.finalize_account_deactivation(uuid) is
  'Server-only finalizer. Re-checks blocking reservations, soft-deletes owned offers and marks the target profile deactivated. Intended for the trusted account-deactivation Edge Function.';

commit;
