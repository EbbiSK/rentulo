alter table public.profiles
  drop constraint if exists profiles_preferred_language_check;

alter table public.profiles
  add constraint profiles_preferred_language_check
  check (preferred_language in ('cs', 'sk', 'en', 'de', 'pl'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    street,
    city,
    postal_code,
    preferred_language
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'street', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'postal_code', ''),
    case lower(coalesce(new.raw_user_meta_data->>'preferred_language', 'cs'))
      when 'sk' then 'sk'
      when 'en' then 'en'
      when 'de' then 'de'
      when 'pl' then 'pl'
      else 'cs'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    preferred_language = excluded.preferred_language,
    updated_at = now();

  return new;
end;
$$;
