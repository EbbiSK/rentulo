revoke all on table public.public_offers from public;
revoke all on table public.public_offers from anon;
revoke all on table public.public_offers from authenticated;

grant select on table public.public_offers to anon;
grant select on table public.public_offers to authenticated;

revoke all on table public.user_rating_summary from public;
revoke all on table public.user_rating_summary from anon;
revoke all on table public.user_rating_summary from authenticated;

grant select on table public.user_rating_summary to anon;
grant select on table public.user_rating_summary to authenticated;