-- Technical preparation for safe account deactivation.
-- This migration does not add a user-facing account deletion action.
-- Final anonymisation and retention rules must be confirmed with a lawyer/accountant.

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists deactivation_requested_at timestamptz,
  add column if not exists deactivated_at timestamptz,
  add column if not exists anonymized_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'deactivated'));

create or replace function public.protect_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.is_verified is distinct from old.is_verified
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be changed';
  end if;

  -- Account lifecycle fields may only be changed by trusted server-side code.
  if (
       new.account_status is distinct from old.account_status
       or new.deactivation_requested_at is distinct from old.deactivation_requested_at
       or new.deactivated_at is distinct from old.deactivated_at
       or new.anonymized_at is distinct from old.anonymized_at
     )
     and current_user <> 'postgres'
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account lifecycle fields cannot be changed directly';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_update() from public;
revoke all on function public.protect_profile_update() from anon;
revoke all on function public.protect_profile_update() from authenticated;
grant execute on function public.protect_profile_update() to service_role;

comment on column public.profiles.account_status is
  'Internal account state. User-facing cancellation and anonymisation are not enabled yet.';
comment on column public.profiles.deactivation_requested_at is
  'Time when an account deactivation request was recorded by trusted server-side code.';
comment on column public.profiles.deactivated_at is
  'Time when the account was deactivated by trusted server-side code.';
comment on column public.profiles.anonymized_at is
  'Time when personal profile data was anonymised under the approved retention process.';
