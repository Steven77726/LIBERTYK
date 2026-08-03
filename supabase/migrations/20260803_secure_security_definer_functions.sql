-- Audit Fix 6B — Reduce SECURITY DEFINER function attack surface.
-- Preserve function logic, names, trigger behavior, and RLS behavior.

-- public.handle_new_user() is executed by the auth.users trigger only.
-- It must not be callable through the public API by anon/authenticated users.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- public.is_admin() is used by existing RLS policies.
-- Remove the broad PUBLIC grant and keep only the roles that need policy evaluation.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- public.is_professional_for(uuid) is used by reservation RLS policies.
-- Remove the broad PUBLIC grant and keep only the roles that need policy evaluation.
revoke execute on function public.is_professional_for(uuid) from public;
grant execute on function public.is_professional_for(uuid) to anon;
grant execute on function public.is_professional_for(uuid) to authenticated;
grant execute on function public.is_professional_for(uuid) to service_role;
