create or replace function public.fill_reservation_pickup_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  offer_row public.offers%rowtype;
begin
  select *
  into offer_row
  from public.offers
  where id = new.offer_id;

  if found then
    new.pickup_phone := coalesce(
      nullif(new.pickup_phone, ''),
      offer_row.pickup_phone
    );

    new.owner_phone := coalesce(
      nullif(new.owner_phone, ''),
      offer_row.pickup_phone
    );

    new.pickup_street := coalesce(
      nullif(new.pickup_street, ''),
      offer_row.pickup_street
    );

    new.pickup_city := coalesce(
      nullif(new.pickup_city, ''),
      offer_row.pickup_city,
      offer_row.city
    );

    new.pickup_postal_code := coalesce(
      nullif(new.pickup_postal_code, ''),
      offer_row.pickup_postal_code,
      offer_row.postal_code
    );

    new.pickup_note := coalesce(
      nullif(new.pickup_note, ''),
      offer_row.pickup_note
    );

    new.pickup_full_address := nullif(
      concat_ws(
        ', ',
        nullif(new.pickup_street, ''),
        nullif(new.pickup_city, ''),
        nullif(new.pickup_postal_code, '')
      ),
      ''
    );
  end if;

  return new;
end;
$function$;

comment on function public.fill_reservation_pickup_data()
is 'Fills pickup data and builds pickup_full_address from the final reservation pickup fields.';
