create or replace function public.protect_review_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.id is distinct from old.id
     or new.reservation_id is distinct from old.reservation_id
     or new.reviewer_id is distinct from old.reviewer_id
     or new.reviewed_user_id is distinct from old.reviewed_user_id
     or new.offer_id is distinct from old.offer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Immutable review fields cannot be changed';
  end if;

  return new;
end;
$function$;

revoke all on function public.protect_review_immutable_fields() from public;
revoke all on function public.protect_review_immutable_fields() from anon;
revoke all on function public.protect_review_immutable_fields() from authenticated;