-- Odstránenie nebezpečných všeobecných práv.
revoke all on table public.payments from anon;
revoke all on table public.payments from authenticated;

revoke all on table public.reservations from anon;
revoke all on table public.reservations from authenticated;

-- Minimálne práva potrebné pre aplikáciu.
grant select, insert
on table public.payments
to authenticated;

grant select, insert, update
on table public.reservations
to authenticated;