create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email
     and nullif(trim(coalesce(new.email, '')), '') is not null then
    update public.profiles
    set
      email = lower(trim(new.email)),
      updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_profile_email_from_auth() from public;
grant execute on function public.sync_profile_email_from_auth() to service_role;

drop trigger if exists on_auth_user_email_changed on auth.users;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_email_from_auth();

-- Dorovnanie profilov, ak bol e-mail v Auth potvrdeny este pred touto migraciou.
update public.profiles as p
set
  email = lower(trim(u.email)),
  updated_at = now()
from auth.users as u
where p.id = u.id
  and nullif(trim(coalesce(u.email, '')), '') is not null
  and lower(trim(p.email)) is distinct from lower(trim(u.email));
