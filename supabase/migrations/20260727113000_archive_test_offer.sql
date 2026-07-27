-- Skryje konkretnu testovaciu ponuku z verejnych vysledkov bez mazania historie.
update public.offers
set status = 'draft'::public.offer_status,
    updated_at = now()
where id = 'e7652901-1684-4409-aaf7-db3bab270b20'::uuid
  and status = 'active'::public.offer_status;
