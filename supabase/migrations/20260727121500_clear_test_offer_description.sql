-- Remove the temporary test description from the remaining test listing.
update public.offers
set description = null,
    updated_at = now()
where id = 'f3579e43-a8b7-4db7-b612-043708b77596'::uuid
  and lower(trim(coalesce(description, ''))) = 'test pila';
