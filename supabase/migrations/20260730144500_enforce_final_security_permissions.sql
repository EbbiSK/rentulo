-- Re-apply the final least-privilege permissions for the Rentulo application.
-- This migration is intentionally idempotent and does not change data or RLS policies.

begin;

-- ---------------------------------------------------------------------------
-- 1. Application tables: remove inherited/broad grants and add only the
--    operations required by the current frontend and trusted backend.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.offers from public, anon, authenticated;
revoke all on table public.reservations from public, anon, authenticated;
revoke all on table public.payments from public, anon, authenticated;
revoke all on table public.notifications from public, anon, authenticated;
revoke all on table public.reviews from public, anon, authenticated;
revoke all on table public.test_payment_users from public, anon, authenticated;
revoke all on table public.reservation_email_deliveries from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.offers to authenticated;
grant select, insert, update on table public.reservations to authenticated;
grant select, insert on table public.payments to authenticated;
grant select, update, delete on table public.notifications to authenticated;
grant select, insert, update, delete on table public.reviews to authenticated;

-- Trusted backend-only tables.
grant all on table public.test_payment_users to service_role;
grant all on table public.reservation_email_deliveries to service_role;

-- ---------------------------------------------------------------------------
-- 2. Public read models: expose only the limited views, never their base tables.
-- ---------------------------------------------------------------------------

alter view public.public_offers
  set (security_invoker = false, security_barrier = true);

alter view public.user_rating_summary
  set (security_invoker = false, security_barrier = true);

revoke all on table public.public_offers from public, anon, authenticated;
revoke all on table public.user_rating_summary from public, anon, authenticated;

grant select on table public.public_offers to anon, authenticated;
grant select on table public.user_rating_summary to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Public/authenticated RPC functions used directly by the application.
-- ---------------------------------------------------------------------------

revoke all on function public.get_blocking_reservations(uuid)
  from public, anon, authenticated;
revoke all on function public.get_blocked_offer_ids()
  from public, anon, authenticated;
revoke all on function public.get_public_map_offers()
  from public, anon, authenticated;
revoke all on function public.get_my_reservations()
  from public, anon, authenticated;
revoke all on function public.change_my_reservation_status(uuid, public.reservation_status)
  from public, anon, authenticated;
revoke all on function public.mark_my_reservation_paid_test(uuid)
  from public, anon, authenticated;

grant execute on function public.get_blocking_reservations(uuid)
  to anon, authenticated;
grant execute on function public.get_blocked_offer_ids()
  to anon, authenticated;
grant execute on function public.get_public_map_offers()
  to anon, authenticated;
grant execute on function public.get_my_reservations()
  to authenticated;
grant execute on function public.change_my_reservation_status(uuid, public.reservation_status)
  to authenticated;
grant execute on function public.mark_my_reservation_paid_test(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Internal validation and trigger functions must not be callable directly
--    by browser-facing roles. Trigger execution itself is not affected.
-- ---------------------------------------------------------------------------

revoke all on function public.can_create_reservation(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.fill_reservation_pickup_data()
  from public, anon, authenticated;
revoke all on function public.handle_new_user()
  from public, anon, authenticated;
revoke all on function public.prepare_payment_insert()
  from public, anon, authenticated;
revoke all on function public.prepare_reservation_insert()
  from public, anon, authenticated;
revoke all on function public.prepare_review_insert()
  from public, anon, authenticated;
revoke all on function public.protect_notification_update()
  from public, anon, authenticated;
revoke all on function public.protect_profile_update()
  from public, anon, authenticated;
revoke all on function public.protect_reservation_immutable_fields()
  from public, anon, authenticated;
revoke all on function public.protect_reservation_status_transition()
  from public, anon, authenticated;
revoke all on function public.protect_review_immutable_fields()
  from public, anon, authenticated;
revoke all on function public.sync_profile_email_from_auth()
  from public, anon, authenticated;
revoke all on function public.sync_reservation_contact_visibility()
  from public, anon, authenticated;

-- Keep explicitly required trusted-backend access.
grant execute on function public.protect_profile_update() to service_role;
grant execute on function public.sync_profile_email_from_auth() to service_role;

-- ---------------------------------------------------------------------------
-- 5. Future objects created by postgres receive no automatic browser grants.
-- ---------------------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

commit;
