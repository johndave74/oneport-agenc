-- =====================================================================
-- OnePort Agency — FIX: stamp rows with the caller's real organization
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Idempotent (replaces a function).
--
-- Bug: operational tables default organizationId to 'org-1', and the old
-- set_org_id() trigger only overrode a NULL. So a customer's insert kept
-- 'org-1' and was rejected by RLS (org mismatch) — blocking Org Admins /
-- agents from creating vessels, port calls, tasks, expenses, etc.
--
-- Fix: for a normal user, ALWAYS stamp the row with their own organization
-- (ignoring the column default). Platform admins may still target any org.
-- The trigger is already attached to every operational table, so replacing
-- the function alone fixes them all.
-- =====================================================================

create or replace function public.set_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_platform_admin() then
    if new."organizationId" is null then
      new."organizationId" := public.current_user_org();
    end if;
  else
    new."organizationId" := public.current_user_org();
  end if;
  return new;
end $$;
