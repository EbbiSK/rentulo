update public.offers
set
  description = '',
  updated_at = now()
where id = 'f3579e43-a8b7-4db7-b612-043708b77596'::uuid
  and lower(trim(coalesce(description, ''))) = 'test pila';
