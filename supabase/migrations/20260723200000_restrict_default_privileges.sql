-- Remove overly broad automatic grants for future application objects
-- created by the postgres role in the public schema.
-- Access to application objects must be granted explicitly.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

-- Restrict existing public views to read-only access.
revoke all on table public.public_offers from anon, authenticated;
grant select on table public.public_offers to anon, authenticated;

revoke all on table public.user_rating_summary from anon, authenticated;
grant select on table public.user_rating_summary to anon, authenticated;