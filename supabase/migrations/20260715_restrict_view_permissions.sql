revoke all on public.public_offers from anon, authenticated;
revoke all on public.user_rating_summary from anon, authenticated;

grant select on public.public_offers to anon, authenticated;
grant select on public.user_rating_summary to anon, authenticated;
