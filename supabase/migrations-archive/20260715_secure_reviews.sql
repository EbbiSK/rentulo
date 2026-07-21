create or replace function public.prepare_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = new.reservation_id;

  if not found then
    raise exception 'Reservation does not exist';
  end if;

  if v_reservation.status <> 'returned' then
    raise exception 'Review is allowed only after reservation is returned';
  end if;

  if auth.uid() = v_reservation.renter_id then
    new.reviewer_id := v_reservation.renter_id;
    new.reviewed_user_id := v_reservation.owner_id;
  elsif auth.uid() = v_reservation.owner_id then
    new.reviewer_id := v_reservation.owner_id;
    new.reviewed_user_id := v_reservation.renter_id;
  else
    raise exception 'User is not related to this reservation';
  end if;

  new.offer_id := v_reservation.offer_id;

  return new;
end;
$function$;

drop trigger if exists prepare_review_before_insert
on public.reviews;

create trigger prepare_review_before_insert
before insert on public.reviews
for each row
execute function public.prepare_review_insert();

create or replace function public.protect_review_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.reservation_id is distinct from old.reservation_id
     or new.reviewer_id is distinct from old.reviewer_id
     or new.reviewed_user_id is distinct from old.reviewed_user_id
     or new.offer_id is distinct from old.offer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Immutable review fields cannot be changed';
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_review_immutable_fields_before_update
on public.reviews;

create trigger protect_review_immutable_fields_before_update
before update on public.reviews
for each row
execute function public.protect_review_immutable_fields();
