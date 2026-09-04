-- Security fix: the "org admin write" policy on public.organizations is a
-- single ALL-command rule (is_platform_admin() OR (id = current_user_org()
-- AND has_permission('company','manage'))) with no restriction on WHICH
-- columns change. Verified live (in a rolled-back transaction) that an
-- ordinary Org Admin can UPDATE their own organization row and set
-- plan='Enterprise', planStatus='active', status='active', isPlatform=true —
-- a free upgrade, a self-un-suspend, and a platform-flag flip, all in one
-- call, with none of it touching a subscription/billing system.
--
-- This mirrors the same fix already applied to public.users: legitimate
-- self-service company-profile edits (name, address, licence, slug) stay
-- allowed; the fields that represent platform-controlled state never change
-- through this path, regardless of what permission the caller holds.

create or replace function public.protect_privileged_org_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.role() = 'service_role' or public.is_platform_admin() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'Only a platform administrator can change organization status.';
  end if;
  if new."isPlatform" is distinct from old."isPlatform" then
    raise exception 'Only a platform administrator can change the platform flag.';
  end if;
  if new.plan is distinct from old.plan then
    raise exception 'Only a platform administrator can change the subscription plan.';
  end if;
  if new."planStatus" is distinct from old."planStatus" then
    raise exception 'Only a platform administrator can change the plan status.';
  end if;
  if new."planExpiry" is distinct from old."planExpiry" then
    raise exception 'Only a platform administrator can change the plan expiry.';
  end if;
  if new."enabledModules" is distinct from old."enabledModules" then
    raise exception 'Only a platform administrator can change enabled modules.';
  end if;
  if new."deletedAt" is distinct from old."deletedAt" or new."deletedBy" is distinct from old."deletedBy" then
    raise exception 'Only a platform administrator can delete or restore an organization.';
  end if;
  if new."createdAt" is distinct from old."createdAt" then
    raise exception 'createdAt cannot be changed.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_privileged_org_columns_trg on public.organizations;
create trigger protect_privileged_org_columns_trg
  before update on public.organizations
  for each row execute function public.protect_privileged_org_columns();
