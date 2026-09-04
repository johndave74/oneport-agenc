-- Security fix: the "self or admin update" policy on public.users only
-- checked WHO was updating a row (id = auth.uid()), never WHICH columns.
-- That let any authenticated user set isPlatformAdmin / platformRole /
-- organizationId / roleId on their OWN row via a direct table update,
-- bypassing every RLS policy in the schema (they all OR in
-- is_platform_admin()). This closes that gap without changing any
-- legitimate flow: the `admin` Edge Function (service_role) and existing
-- platform admins are unaffected; only a raw, unauthorized column change
-- is blocked.

create or replace function public.protect_privileged_user_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- The `admin` Edge Function (service_role) already authorises the caller
  -- itself before writing; existing platform admins may manage these
  -- fields for other users (e.g. inviting platform staff).
  if auth.role() = 'service_role' or public.is_platform_admin() then
    return new;
  end if;

  if new."organizationId" is distinct from old."organizationId" then
    raise exception 'Only a platform administrator can move a user between organizations.';
  end if;
  if new."isPlatformAdmin" is distinct from old."isPlatformAdmin" then
    raise exception 'Only a platform administrator can grant platform admin access.';
  end if;
  if new."platformRole" is distinct from old."platformRole" then
    raise exception 'Only a platform administrator can change platform role.';
  end if;
  if new."platformDepartment" is distinct from old."platformDepartment" then
    raise exception 'Only a platform administrator can change platform department.';
  end if;

  -- roleId drives has_permission() the same way `role` does. `role` itself
  -- is already guarded (protect_org_admins blocks self-changes entirely);
  -- roleId needs the same never-yourself rule, but an org admin with
  -- users:manage may still change *another* user's roleId.
  if new."roleId" is distinct from old."roleId" then
    if new.id = auth.uid() then
      raise exception 'You cannot change your own role. Ask another administrator.';
    end if;
    if not public.has_permission('users', 'manage') then
      raise exception 'You do not have permission to change roles.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_privileged_columns_trg on public.users;
create trigger protect_privileged_columns_trg
  before update on public.users
  for each row execute function public.protect_privileged_user_columns();
