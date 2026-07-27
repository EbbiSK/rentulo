-- Odstrani iba dve presne identifikovane stare testovacie ponuky.
-- Naviazane rezervacie, platby a hodnotenia sa odstrania cez ON DELETE CASCADE.
-- Notifikacie cielene odstraníme vopred, aby po testoch nezostali osamotene zaznamy.

do $$
declare
  v_test_offer_ids uuid[] := array[
    'e7652901-1684-4409-aaf7-db3bab270b20'::uuid,
    'f3579e43-a8b7-4db7-b612-043708b77596'::uuid
  ];
begin
  delete from public.notifications
  where related_offer_id = any(v_test_offer_ids)
     or related_reservation_id in (
       select id
       from public.reservations
       where offer_id = any(v_test_offer_ids)
     );

  delete from public.offers
  where id = any(v_test_offer_ids);
end
$$;
