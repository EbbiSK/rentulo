create table if not exists public.test_payment_users (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.test_payment_users enable row level security;

revoke all on table public.test_payment_users from public;
revoke all on table public.test_payment_users from anon;
revoke all on table public.test_payment_users from authenticated;

insert into public.test_payment_users (user_id)
values ('d13de11d-ca9c-4bbe-9986-03fa1100ea60')
on conflict (user_id) do nothing;

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

  if not found then
    raise exception
      'Reservation is not approved, does not exist, or user is not its renter';
  end if;
end;
$function$;

revoke all
on function public.mark_my_reservation_paid_test(uuid)
from public, anon, authenticated;

grant execute
on function public.mark_my_reservation_paid_test(uuid)
to authenticated;