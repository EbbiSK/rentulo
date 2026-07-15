create or replace function public.protect_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.user_id is distinct from old.user_id
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
$function$;

drop trigger if exists protect_notification_before_update
on public.notifications;

create trigger protect_notification_before_update
before update on public.notifications
for each row
execute function public.protect_notification_update();

drop policy if exists notifications_insert_own
on public.notifications;

revoke insert
on public.notifications
from anon, authenticated;
