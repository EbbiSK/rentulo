create or replace function public.protect_reservation_status_transition()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = old.status then
    return new;
  end if;

  if auth.uid() = old.owner_id then
    if
      (old.status = 'pending' and new.status in ('approved', 'rejected'))
      or (old.status = 'paid' and new.status = 'picked_up')
      or (old.status = 'picked_up' and new.status = 'returned')
    then
      return new;
    end if;

    raise exception
      'Owner is not allowed to change reservation status from % to %',
      old.status,
      new.status;
  end if;

  if auth.uid() = old.renter_id then
    if
      (old.status = 'approved' and new.status = 'paid')
      or (
        old.status in ('pending', 'approved')
        and new.status = 'cancelled'
      )
    then
      return new;
    end if;

    raise exception
      'Renter is not allowed to change reservation status from % to %',
      old.status,
      new.status;
  end if;

  raise exception 'User is not related to this reservation';
end;
$function$;