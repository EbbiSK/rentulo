create or replace function public.protect_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.related_reservation_id is distinct from old.related_reservation_id
     or new.related_offer_id is distinct from old.related_offer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Only notification read status can be changed';
  end if;

  return new;
end;
$$;