do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_full_name_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_full_name_length_check
      check (char_length(trim(full_name)) between 1 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_email_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_email_length_check
      check (char_length(trim(email)) between 3 and 254);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_phone_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_length_check
      check (char_length(trim(phone)) between 1 and 32);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_street_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_street_length_check
      check (char_length(trim(street)) between 1 and 160);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_city_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_city_length_check
      check (char_length(trim(city)) between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_postal_code_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_postal_code_length_check
      check (char_length(trim(postal_code)) between 1 and 20);
  end if;
end
$$;
