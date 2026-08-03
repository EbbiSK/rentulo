revoke all on function public.can_create_reservation(uuid, uuid, uuid)
from public, anon, authenticated;

grant execute on function public.can_create_reservation(uuid, uuid, uuid)
to authenticated, service_role;
