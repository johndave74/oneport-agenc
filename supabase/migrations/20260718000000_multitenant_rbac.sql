-- =====================================================================
-- OnePort Agency — Phase 2: Multi-tenant isolation + RBAC + invitations
-- ---------------------------------------------------------------------
-- Scope (agreed): Organizations with data isolation, a roles/permissions
-- model that drives navigation, and invitation-only onboarding. Branches &
-- Departments are intentionally deferred to a later migration.
--
-- Design principles:
--   * Backward compatible. Existing rows/users keep working: every new
--     column is nullable or defaulted, existing data is backfilled to
--     'org-1', and the legacy users.role text column is kept in sync.
--   * Tenant isolation is enforced in the database (RLS), not the client.
--     A BEFORE INSERT trigger stamps organizationId automatically, so the
--     existing client code needs no change to stay isolated.
--   * Permissions drive the UI/navigation (see src/lib/rbac/permissions.ts).
--     RLS enforces the hard tenant boundary; per-permission row rules can be
--     layered on later without breaking this migration.
--
-- Idempotent: safe to run more than once.
-- =====================================================================

-- ============================================================
-- 1. Organizations — richer tenant record
-- ============================================================
alter table public.organizations add column if not exists slug text;
alter table public.organizations add column if not exists status text not null default 'active';
alter table public.organizations add column if not exists "createdAt" timestamptz not null default now();
update public.organizations set slug = coalesce(slug, lower(regexp_replace("companyName", '[^a-zA-Z0-9]+', '-', 'g'))) where slug is null;

-- ============================================================
-- 2. Users — platform-admin flag, account status, role linkage
-- ============================================================
alter table public.users add column if not exists "isPlatformAdmin" boolean not null default false;
alter table public.users add column if not exists "accountStatus" text not null default 'active';
alter table public.users add column if not exists "roleId" text;

-- The legacy role text column only allowed the original four agent roles; the
-- RBAC model introduces more (ORG_ADMIN, FINANCE, VIEWER, …). Widen it to the
-- full set of role keys so invited users can be created.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in (
  'PLATFORM_SUPER_ADMIN','ORG_ADMIN','OPERATIONS_MANAGER','PORT_AGENT','SHIP_AGENT',
  'PROTECTIVE_AGENT','FINANCE','DOCUMENTATION','VIEWER'
));

-- ============================================================
-- 3. Roles & Permissions
-- ============================================================
create table if not exists public.roles (
  id text primary key,
  key text not null,
  name text not null,
  description text,
  "isSystem" boolean not null default false,
  "organizationId" text references public.organizations(id) on delete cascade, -- null = global system role
  "createdAt" timestamptz not null default now()
);

create table if not exists public.permissions (
  id text primary key,          -- '<module>:<action>'
  module text not null,
  action text not null,         -- view | create | edit | delete | approve | manage
  description text
);

create table if not exists public.role_permissions (
  "roleId" text not null references public.roles(id) on delete cascade,
  "permissionId" text not null references public.permissions(id) on delete cascade,
  primary key ("roleId", "permissionId")
);

alter table public.users
  add constraint users_roleId_fkey foreign key ("roleId") references public.roles(id) on delete set null
  not valid;  -- 'not valid' so pre-existing rows with null roleId aren't rechecked

-- ------------------------------------------------------------
-- 3a. Seed the permission catalogue (module × action)
-- ------------------------------------------------------------
insert into public.permissions (id, module, action, description)
select m || ':' || a, m, a, initcap(a) || ' ' || m
from (values
  ('dashboard'),('port_calls'),('planning'),('vessels'),('tasks'),('crew'),
  ('documents'),('expenses'),('invoices'),('tariffs'),('approvals'),('laytime'),
  ('partners'),('agents'),('messages'),('reports'),('notifications'),('settings'),
  ('users'),('roles'),('company'),('audit_logs')
) as modules(m)
cross join (values ('view'),('create'),('edit'),('delete'),('approve'),('manage')) as actions(a)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3b. Seed system roles (global templates, organizationId = null)
-- ------------------------------------------------------------
insert into public.roles (id, key, name, description, "isSystem", "organizationId") values
  ('role-platform-super-admin', 'PLATFORM_SUPER_ADMIN', 'Platform Super Admin', 'Full control across all organizations.', true, null),
  ('role-org-admin',            'ORG_ADMIN',            'Organization Admin',    'Full control within their organization.', true, null),
  ('role-operations-manager',   'OPERATIONS_MANAGER',   'Operations Manager',    'Oversees all operations, approvals and reports.', true, null),
  ('role-port-agent',           'PORT_AGENT',           'Port Agent',            'Manages port calls, vessels, tasks and documents.', true, null),
  ('role-ship-agent',           'SHIP_AGENT',           'Ship Agent',            'Manages port calls, laytime and disbursements.', true, null),
  ('role-protective-agent',     'PROTECTIVE_AGENT',     'Protective Agent',      'Oversees incidents, risk and cost audits.', true, null),
  ('role-finance',              'FINANCE',              'Finance Officer',       'Invoices, disbursements, tariffs and approvals.', true, null),
  ('role-documentation',        'DOCUMENTATION',        'Documentation Officer', 'Documents, clearances and filings.', true, null),
  ('role-viewer',               'VIEWER',               'Viewer',                'Read-only access to operational data.', true, null)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3c. Default role → permission grants
-- ------------------------------------------------------------
-- Admin-tier roles get every permission.
insert into public.role_permissions ("roleId", "permissionId")
select r.id, p.id from public.roles r cross join public.permissions p
where r.id in ('role-platform-super-admin', 'role-org-admin', 'role-operations-manager')
on conflict do nothing;

-- Viewer: view-only on operational modules.
insert into public.role_permissions ("roleId", "permissionId")
select 'role-viewer', p.id from public.permissions p
where p.action = 'view'
  and p.module in ('dashboard','port_calls','planning','vessels','tasks','crew','documents','expenses','invoices','tariffs','laytime','partners','agents','messages','reports','notifications')
on conflict do nothing;

-- Helper to grant a set of (module, action) pairs to a role.
do $$
declare
  grants jsonb := '{
    "role-port-agent":       {"view":["dashboard","port_calls","planning","vessels","tasks","crew","documents","expenses","invoices","tariffs","approvals","partners","agents","messages","reports","notifications","settings"],"create":["port_calls","vessels","tasks","documents","expenses","invoices"],"edit":["port_calls","vessels","tasks","documents"],"delete":["tasks"]},
    "role-ship-agent":       {"view":["dashboard","port_calls","planning","vessels","crew","documents","expenses","invoices","tariffs","approvals","laytime","partners","agents","messages","reports","notifications","settings"],"create":["port_calls","expenses","invoices","laytime"],"edit":["port_calls","laytime","expenses"]},
    "role-protective-agent": {"view":["dashboard","port_calls","planning","vessels","tasks","crew","documents","expenses","invoices","tariffs","approvals","partners","agents","messages","reports","notifications","settings"],"create":["tasks"],"edit":["tasks"],"approve":["expenses"]},
    "role-finance":          {"view":["dashboard","port_calls","expenses","invoices","tariffs","approvals","partners","reports","notifications","settings"],"create":["invoices","tariffs","expenses"],"edit":["invoices","tariffs","expenses"],"approve":["expenses","invoices"]},
    "role-documentation":    {"view":["dashboard","port_calls","vessels","crew","documents","partners","agents","messages","reports","notifications","settings"],"create":["documents"],"edit":["documents"],"delete":["documents"]}
  }'::jsonb;
  role_key text;
  action_key text;
  module_val text;
begin
  for role_key in select jsonb_object_keys(grants) loop
    for action_key in select jsonb_object_keys(grants->role_key) loop
      for module_val in select jsonb_array_elements_text(grants->role_key->action_key) loop
        insert into public.role_permissions ("roleId", "permissionId")
        values (role_key, module_val || ':' || action_key)
        on conflict do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3d. Backfill roleId on existing users from their legacy role text
-- ------------------------------------------------------------
update public.users u set "roleId" = r.id
from public.roles r
where u."roleId" is null and r.key = u.role and r."organizationId" is null;

-- ============================================================
-- 4. Invitations (invitation-only onboarding)
-- ============================================================
create table if not exists public.invitations (
  id text primary key,
  email text not null,
  "organizationId" text not null references public.organizations(id) on delete cascade,
  "roleId" text references public.roles(id) on delete set null,
  "invitedBy" uuid references public.users(id) on delete set null,
  "invitedByName" text,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  "expiresAt" timestamptz not null default (now() + interval '7 days'),
  "acceptedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);
create index if not exists invitations_email_idx on public.invitations (lower(email));
create index if not exists invitations_org_idx on public.invitations ("organizationId");

-- ============================================================
-- 5. Tenant column + auto-stamp trigger on every operational table
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'vessels','voyages','tasks','documents','expenses','messages','notifications',
    'incidents','audit_logs','laytime_calculations','partners','crew_members','tariffs','invoices'
  ] loop
    execute format('alter table public.%I add column if not exists "organizationId" text default ''org-1'' references public.organizations(id)', t);
    execute format('update public.%I set "organizationId" = ''org-1'' where "organizationId" is null', t);
    execute format('create index if not exists %I on public.%I ("organizationId")', t || '_org_idx', t);
  end loop;
end $$;

-- ============================================================
-- 6. RLS helper functions (SECURITY DEFINER — bypass RLS internally)
-- ============================================================
create or replace function public.current_user_org()
returns text language sql stable security definer set search_path = public as $$
  select "organizationId" from public.users where id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select "isPlatformAdmin" from public.users where id = auth.uid()), false)
$$;

create or replace function public.has_permission(p_module text, p_action text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.users u
    join public.role_permissions rp on rp."roleId" = u."roleId"
    where u.id = auth.uid() and rp."permissionId" = p_module || ':' || p_action
  )
$$;

-- Auto-stamp organizationId on insert so the client never has to set it.
create or replace function public.set_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new."organizationId" is null then
    new."organizationId" := public.current_user_org();
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'vessels','voyages','tasks','documents','expenses','messages','notifications',
    'incidents','audit_logs','laytime_calculations','partners','crew_members','tariffs','invoices'
  ] loop
    execute format('drop trigger if exists set_org_id_trg on public.%I', t);
    execute format('create trigger set_org_id_trg before insert on public.%I for each row execute function public.set_org_id()', t);
  end loop;
end $$;

-- ============================================================
-- 7. Org-scoped RLS policies (replace the blanket authenticated policy)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'vessels','voyages','tasks','documents','expenses','messages','notifications',
    'incidents','audit_logs','laytime_calculations','partners','crew_members','tariffs','invoices'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "authenticated read/write" on public.%I', t);
    execute format('drop policy if exists "tenant isolation" on public.%I', t);
    execute format($f$create policy "tenant isolation" on public.%I for all
      using ("organizationId" = public.current_user_org() or public.is_platform_admin())
      with check ("organizationId" = public.current_user_org() or public.is_platform_admin())$f$, t);
  end loop;
end $$;

-- Organizations: you see your own; platform admin sees all.
drop policy if exists "authenticated read/write" on public.organizations;
drop policy if exists "org visibility" on public.organizations;
create policy "org visibility" on public.organizations for select
  using (id = public.current_user_org() or public.is_platform_admin());
create policy "org admin write" on public.organizations for all
  using (public.is_platform_admin() or (id = public.current_user_org() and public.has_permission('company','manage')))
  with check (public.is_platform_admin() or (id = public.current_user_org() and public.has_permission('company','manage')));

-- Users: visible within the same org (or platform admin).
drop policy if exists "authenticated read/write" on public.users;
drop policy if exists "org members" on public.users;
create policy "org members" on public.users for select
  using ("organizationId" = public.current_user_org() or public.is_platform_admin() or id = auth.uid());
create policy "self or admin update" on public.users for update
  using (id = auth.uid() or public.is_platform_admin() or public.has_permission('users','manage'))
  with check (id = auth.uid() or public.is_platform_admin() or public.has_permission('users','manage'));

-- Roles / permissions: readable by all authenticated (needed to build nav);
-- writable only by platform admin (org-scoped custom roles come later).
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
drop policy if exists "read roles" on public.roles;
create policy "read roles" on public.roles for select using (auth.role() = 'authenticated');
create policy "write roles" on public.roles for all using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists "read permissions" on public.permissions;
create policy "read permissions" on public.permissions for select using (auth.role() = 'authenticated');
drop policy if exists "read role_permissions" on public.role_permissions;
create policy "read role_permissions" on public.role_permissions for select using (auth.role() = 'authenticated');
create policy "write role_permissions" on public.role_permissions for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Invitations: managed within the org by user-managers; the accept flow runs
-- through the Edge Function (service role), which bypasses RLS.
alter table public.invitations enable row level security;
drop policy if exists "org invitations" on public.invitations;
create policy "org invitations" on public.invitations for all
  using (public.is_platform_admin() or ("organizationId" = public.current_user_org() and public.has_permission('users','manage')))
  with check (public.is_platform_admin() or ("organizationId" = public.current_user_org() and public.has_permission('users','manage')));

-- ============================================================
-- 8. handle_new_user(): honour invitation metadata + link roleId
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org text;
  v_role_key text;
  v_role_id text;
begin
  v_org := coalesce(new.raw_user_meta_data->>'organizationId', 'org-1');
  v_role_key := coalesce(new.raw_user_meta_data->>'role', 'PORT_AGENT');
  select id into v_role_id from public.roles where key = v_role_key and "organizationId" is null limit 1;

  insert into public.users (id, name, email, role, "organizationId", "roleId", "isPlatformAdmin")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    v_role_key,
    v_org,
    v_role_id,
    coalesce((new.raw_user_meta_data->>'isPlatformAdmin')::boolean, false)
  );
  return new;
end $$;
