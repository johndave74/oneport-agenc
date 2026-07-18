-- =====================================================================
-- OnePort Agency — Platform Team vs Organization Users separation
-- ---------------------------------------------------------------------
-- Run this in the Supabase SQL Editor. It is additive and idempotent.
--
-- Adds platform-staff fields to users, introduces the Supervisory Agent
-- role, and teaches handle_new_user() to persist the new fields. A user is
-- "Platform Team" when platformRole IS NOT NULL; otherwise they are an
-- Organization User.
-- =====================================================================

alter table public.users add column if not exists "platformRole" text;
alter table public.users add column if not exists "platformDepartment" text;

-- Supervisory Agent joins the org role set.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in (
  'PLATFORM_SUPER_ADMIN','ORG_ADMIN','OPERATIONS_MANAGER','PORT_AGENT','SHIP_AGENT',
  'PROTECTIVE_AGENT','SUPERVISORY_AGENT','FINANCE','DOCUMENTATION','VIEWER'
));

insert into public.roles (id, key, name, description, "isSystem", "organizationId") values
  ('role-supervisory-agent', 'SUPERVISORY_AGENT', 'Supervisory Agent', 'Operational oversight on behalf of the owner/charterer.', true, null)
on conflict (id) do nothing;

insert into public.role_permissions ("roleId", "permissionId")
select 'role-supervisory-agent', p.id from public.permissions p
where p.action = 'view'
  and p.module in ('dashboard','port_calls','planning','vessels','tasks','crew','documents','expenses','invoices','tariffs','approvals','laytime','partners','agents','messages','reports','notifications','settings')
on conflict do nothing;

-- Persist platform fields on signup / admin-create.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org text; v_role_key text; v_role_id text;
begin
  v_org := coalesce(new.raw_user_meta_data->>'organizationId', 'org-1');
  v_role_key := coalesce(new.raw_user_meta_data->>'role', 'VIEWER');
  select id into v_role_id from public.roles where key = v_role_key and "organizationId" is null limit 1;
  insert into public.users (id, name, email, role, "organizationId", "roleId", "isPlatformAdmin", "platformRole", "platformDepartment")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email, v_role_key, v_org, v_role_id,
    coalesce((new.raw_user_meta_data->>'isPlatformAdmin')::boolean, false),
    new.raw_user_meta_data->>'platformRole',
    new.raw_user_meta_data->>'platformDepartment'
  );
  return new;
end $$;

-- Your existing super admin becomes a Platform Team member.
update public.users set "platformRole" = 'PLATFORM_SUPER_ADMIN'
where "isPlatformAdmin" = true and "platformRole" is null;
