-- Include the related offer photo in the safe reservation reader used by
-- the "Moje rezervace" page. Contact visibility rules remain unchanged.

begin;

drop function if exists public.get_my_reservations();

create function public.get_my_reservations()
returns table (
  id uuid,
  offer_id uuid,
  owner_id uuid,
  renter_id uuid,
  start_date date,
  end_date date,
  days integer,
  price_per_day integer,
  total_price integer,
  platform_fee_percent integer,
  platform_fee_amount integer,
  owner_payout integer,
  status public.reservation_status,
  contact_visible boolean,
  created_at timestamptz,
  updated_at timestamptz,
  offer_name text,
  category text,
  city text,
  total_days integer,
  renter_name text,
  renter_email text,
  renter_phone text,
  owner_name text,
  contact_visible_after_payment boolean,
  date_from date,
  date_to date,
  paid_at timestamptz,
  payment_provider_status text,
  owner_phone text,
  pickup_phone text,
  pickup_street text,
  pickup_city text,
  pickup_postal_code text,
  pickup_full_address text,
  pickup_note text,
  photo_url text
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    r.id,
    r.offer_id,
    r.owner_id,
    r.renter_id,
    r.start_date,
    r.end_date,
    r.days,
    r.price_per_day,
    r.total_price,
    r.platform_fee_percent,
    r.platform_fee_amount,
    r.owner_payout,
    r.status,

    r.status in ('paid', 'picked_up', 'returned')
      as contact_visible,

    r.created_at,
    r.updated_at,
    r.offer_name,
    r.category,
    r.city,
    r.total_days,
    r.renter_name,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.renter_email
      else null
    end as renter_email,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.renter_phone
      else null
    end as renter_phone,

    r.owner_name,

    r.status in ('paid', 'picked_up', 'returned')
      as contact_visible_after_payment,

    r.date_from,
    r.date_to,
    r.paid_at,
    r.payment_provider_status,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.owner_phone
      else null
    end as owner_phone,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_phone
      else null
    end as pickup_phone,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_street
      else null
    end as pickup_street,

    r.pickup_city,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_postal_code
      else null
    end as pickup_postal_code,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_full_address
      else null
    end as pickup_full_address,

    case
      when r.status in ('paid', 'picked_up', 'returned')
        then r.pickup_note
      else null
    end as pickup_note,

    coalesce(o.photo_url, '') as photo_url

  from public.reservations r
  left join public.offers o
    on o.id = r.offer_id
  where auth.uid() is not null
    and (
      r.owner_id = auth.uid()
      or r.renter_id = auth.uid()
    )
  order by r.created_at desc;
$function$;

alter function public.get_my_reservations()
owner to postgres;

revoke all on function public.get_my_reservations()
from public, anon, authenticated;

grant execute on function public.get_my_reservations()
to authenticated, service_role;

commit;
