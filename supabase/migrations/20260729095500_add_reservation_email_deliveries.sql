create table if not exists public.reservation_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type text not null check (event_type in (
    'new_request',
    'approved',
    'rejected',
    'cancelled',
    'paid',
    'picked_up',
    'returned'
  )),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (reservation_id, event_type, recipient_id)
);

alter table public.reservation_email_deliveries enable row level security;

revoke all on table public.reservation_email_deliveries from public;
revoke all on table public.reservation_email_deliveries from anon;
revoke all on table public.reservation_email_deliveries from authenticated;
grant all on table public.reservation_email_deliveries to service_role;

create index if not exists reservation_email_deliveries_reservation_idx
  on public.reservation_email_deliveries (reservation_id, created_at desc);
