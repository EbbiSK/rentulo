create or replace function public.protect_reservation_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

    raise exception 'Owner is not allowed to change reservation status from % to %',
      old.status, new.status;
  end if;

  if auth.uid() = old.renter_id then
    if old.status = 'approved' and new.status = 'paid' then
      return new;
    end if;

    raise exception 'Renter is not allowed to change reservation status from % to %',
      old.status, new.status;
  end if;

  raise exception 'User is not related to this reservation';
end;
$$;

drop trigger if exists trg_protect_reservation_status_transition
on public.reservations;

create trigger trg_protect_reservation_status_transition
before update of status on public.reservations
for each row
execute function public.protect_reservation_status_transition();
