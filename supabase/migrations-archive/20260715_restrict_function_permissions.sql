revoke execute on function public.fill_reservation_pickup_data() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prepare_payment_insert() from public, anon, authenticated;
revoke execute on function public.prepare_reservation_insert() from public, anon, authenticated;
revoke execute on function public.prepare_review_insert() from public, anon, authenticated;
revoke execute on function public.protect_notification_update() from public, anon, authenticated;
revoke execute on function public.protect_profile_update() from public, anon, authenticated;
revoke execute on function public.protect_reservation_immutable_fields() from public, anon, authenticated;
revoke execute on function public.protect_reservation_status_transition() from public, anon, authenticated;
revoke execute on function public.protect_review_immutable_fields() from public, anon, authenticated;
revoke execute on function public.sync_reservation_contact_visibility() from public, anon, authenticated;

revoke execute on function public.can_create_reservation(uuid, uuid, uuid) from public, anon;
grant execute on function public.can_create_reservation(uuid, uuid, uuid) to authenticated;
