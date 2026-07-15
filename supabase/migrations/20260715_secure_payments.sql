create unique index if not exists payments_one_per_reservation
on public.payments (reservation_id);
