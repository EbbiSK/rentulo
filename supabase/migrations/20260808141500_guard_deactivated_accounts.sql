-- Block browser-facing access for accounts that have been deactivated.
-- This migration does not deactivate any account and does not change user data.

begin;

create or replace function public.is_current_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
  );
$$;

revoke all on function public.is_current_account_active()
  from public, anon, authenticated;
grant execute on function public.is_current_account_active()
  to authenticated;

comment on function public.is_current_account_active() is
  'Returns true only when the authenticated user has an active Rentulo profile.';

-- Profiles: keep profile creation unchanged, but block reads/updates after deactivation.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  and public.is_current_account_active()
)
with check (
  id = auth.uid()
  and public.is_current_account_active()
);

-- Offers: public active-offer reads remain unchanged; own writes/reads require an active account.
drop policy if exists offers_insert_own on public.offers;
create policy offers_insert_own
on public.offers
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists offers_select_own on public.offers;
create policy offers_select_own
on public.offers
for select
to authenticated
using (
  owner_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists offers_update_own on public.offers;
create policy offers_update_own
on public.offers
for update
to authenticated
using (
  owner_id = auth.uid()
  and public.is_current_account_active()
)
with check (
  owner_id = auth.uid()
  and public.is_current_account_active()
);

-- Reservations: direct browser access is unavailable after deactivation.
drop policy if exists reservations_insert_as_renter on public.reservations;
create policy reservations_insert_as_renter
on public.reservations
for insert
to authenticated
with check (
  renter_id = auth.uid()
  and public.is_current_account_active()
  and public.can_create_reservation(offer_id, owner_id, renter_id)
);

drop policy if exists reservations_select_related on public.reservations;
create policy reservations_select_related
on public.reservations
for select
to authenticated
using (
  public.is_current_account_active()
  and (
    renter_id = auth.uid()
    or owner_id = auth.uid()
  )
);

drop policy if exists reservations_update_related on public.reservations;
create policy reservations_update_related
on public.reservations
for update
to authenticated
using (
  public.is_current_account_active()
  and (
    renter_id = auth.uid()
    or owner_id = auth.uid()
  )
)
with check (
  public.is_current_account_active()
  and (
    renter_id = auth.uid()
    or owner_id = auth.uid()
  )
);

-- Payments.
drop policy if exists payments_insert_as_payer on public.payments;
create policy payments_insert_as_payer
on public.payments
for insert
to authenticated
with check (
  payer_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists payments_select_related on public.payments;
create policy payments_select_related
on public.payments
for select
to authenticated
using (
  public.is_current_account_active()
  and (
    payer_id = auth.uid()
    or owner_id = auth.uid()
  )
);

-- Notifications.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_current_account_active()
)
with check (
  user_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_current_account_active()
);

-- Reviews: public reads remain unchanged; mutations require an active account.
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own
on public.reviews
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own
on public.reviews
for update
to authenticated
using (
  reviewer_id = auth.uid()
  and public.is_current_account_active()
)
with check (
  reviewer_id = auth.uid()
  and public.is_current_account_active()
);

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own
on public.reviews
for delete
to authenticated
using (
  reviewer_id = auth.uid()
  and public.is_current_account_active()
);

-- Storage: keep public reads unchanged, but prevent a deactivated account from
-- uploading, replacing or deleting files through an old JWT.
drop policy if exists offer_photos_insert_own on storage.objects;
create policy offer_photos_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_current_account_active()
);

drop policy if exists offer_photos_update_own on storage.objects;
create policy offer_photos_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offer-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_current_account_active()
)
with check (
  bucket_id = 'offer-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_current_account_active()
);

drop policy if exists offer_photos_delete_own on storage.objects;
create policy offer_photos_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'offer-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_current_account_active()
);

commit;
