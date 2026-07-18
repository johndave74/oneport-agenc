-- =====================================================================
-- OnePort Agency — Org Admin safeguards (prevent self-lockout)
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- Enforced at the database so it holds even if the UI is bypassed:
--   1. No user may change their OWN role.
--   2. A customer organization must always keep >= 1 Organization Admin.
-- Service-role calls (Edge Functions) have a null auth.uid(), so the
-- self-role rule doesn't block trusted server operations.
-- =====================================================================

create or replace function public.protect_org_admins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    -- 1. You cannot change your own role.
    if new.id = auth.uid() then
      raise exception 'You cannot change your own role. Ask another administrator.';
    end if;

    -- 2. Keep at least one Org Admin per customer organization.
    if old.role = 'ORG_ADMIN' and new.role <> 'ORG_ADMIN'
       and exists (
         select 1 from public.organizations o
         where o.id = old."organizationId" and coalesce(o."isPlatform", false) = false
       )
       and (
         select count(*) from public.users u
         where u."organizationId" = old."organizationId" and u.role = 'ORG_ADMIN' and u.id <> old.id
       ) = 0
    then
      raise exception 'This is the last Organization Admin. Promote another admin before changing this one.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_org_admins_trg on public.users;
create trigger protect_org_admins_trg before update on public.users
  for each row execute function public.protect_org_admins();
