create or replace function public.prepare_reservation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_offer public.offers%rowtype;
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
     or new.end_date < new.start_date then
    raise exception 'Invalid reservation dates';
  end if;

  new.owner_id := v_offer.owner_id;
  new.renter_id := auth.uid();
  new.days := (new.end_date - new.start_date) + 1;
  new.price_per_day := v_offer.price_per_day;
  new.deposit := v_offer.deposit;
  new.total_price := new.days * new.price_per_day;
  new.platform_fee_percent := 10;
  new.platform_fee_amount :=
    round(new.total_price * new.platform_fee_percent / 100.0)::integer;
  new.owner_payout :=
    new.total_price - new.platform_fee_amount;
  new.status := 'pending';
  new.contact_visible := false;

  return new;
end;
$function$;

drop trigger if exists prepare_reservation_before_insert
on public.reservations;

create trigger prepare_reservation_before_insert
before insert on public.reservations
for each row
execute function public.prepare_reservation_insert();
