-- Account deactivation eligibility check.
-- This migration only exposes a read-only RPC for the currently authenticated user.
-- It does not deactivate accounts, delete data, or change offer/reservation state.

begin;

create or replace function public.get_my_account_deactivation_status()
returns table (
  account_status text,
  can_deactivate boolean,
  blocking_reservations_count bigint,
  blocking_as_owner_count bigint,
  blocking_as_renter_count bigint,
  offers_to_close_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_status text;
  v_blocking_total bigint := 0;
  v_blocking_as_owner bigint := 0;
  v_blocking_as_renter bigint := 0;
  v_offers_to_close bigint := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select p.account_status
    into v_account_status
  from public.profiles p
  where p.id = v_user_id;

  if v_account_status is null then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  select
    count(*),
    count(*) filter (where r.owner_id = v_user_id),
    count(*) filter (where r.renter_id = v_user_id)
  into
    v_blocking_total,
    v_blocking_as_owner,
    v_blocking_as_renter
  from public.reservations r
  where (
      r.owner_id = v_user_id
      or r.renter_id = v_user_id
    )
    and r.status in (
      'pending'::public.reservation_status,
      'approved'::public.reservation_status,
      'paid'::public.reservation_status,
      'picked_up'::public.reservation_status
    );

  select count(*)
    into v_offers_to_close
  from public.offers o
  where o.owner_id = v_user_id
    and o.status <> 'deleted'::public.offer_status;

  return query
  select
    v_account_status,
    (
      v_account_status = 'active'
      and v_blocking_total = 0
    ),
    v_blocking_total,
    v_blocking_as_owner,
    v_blocking_as_renter,
    v_offers_to_close;
end;
$$;

revoke all
on function public.get_my_account_deactivation_status()
from public, anon, authenticated;

grant execute
on function public.get_my_account_deactivation_status()
to authenticated;

comment on function public.get_my_account_deactivation_status() is
  'Returns whether the current authenticated account may be deactivated. Blocking reservation states are pending, approved, paid and picked_up. Non-deleted offers are reported for later soft deletion but do not block deactivation.';

commit;
