-- Preserve reservation and review history by preventing physical offer deletion.
-- Offers are removed from the application by changing status to "deleted".

drop policy if exists offers_delete_own on public.offers;

revoke delete
on table public.offers
from authenticated;

revoke delete
on table public.offers
from anon;
