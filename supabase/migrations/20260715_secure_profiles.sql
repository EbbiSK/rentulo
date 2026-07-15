create or replace function public.protect_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.id is distinct from old.id
     or new.is_verified is distinct from old.is_verified
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be changed';
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_profile_before_update
on public.profiles;

create trigger protect_profile_before_update
before update on public.profiles
for each row
execute function public.protect_profile_update();
