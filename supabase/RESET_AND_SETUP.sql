-- =====================================================================
-- OnePort Agency — FULL RESET + FRESH SETUP  (run once, in the SQL Editor)
-- =====================================================================
-- ⚠️  THIS DELETES EVERYTHING in the app database and all user accounts,
--     then rebuilds the schema from scratch and creates ONE admin (you).
--     There is no demo data. After running it, the app is empty and yours.
--
-- HOW TO USE:
--   1. Scroll to the very bottom (STEP 9) and change the 4 lines marked
--      «CHANGE THIS» to your name, email and a password you'll remember.
--   2. Supabase Dashboard → SQL Editor → paste this whole file → Run.
--   3. Open the app and sign in with that email + password. You're the admin.
-- =====================================================================

create extension if not exists pgcrypto;

-- ============================================================
-- STEP 0 — Clean slate: drop everything and wipe all accounts
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.current_user_org() cascade;
drop function if exists public.is_platform_admin() cascade;
drop function if exists public.has_permission(text, text) cascade;
drop function if exists public.set_org_id() cascade;

drop table if exists public.invitations cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.invoices cascade;
drop table if exists public.tariffs cascade;
drop table if exists public.crew_members cascade;
drop table if exists public.partners cascade;
drop table if exists public.laytime_calculations cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.incidents cascade;
drop table if exists public.notifications cascade;
drop table if exists public.messages cascade;
drop table if exists public.expenses cascade;
drop table if exists public.documents cascade;
drop table if exists public.tasks cascade;
drop table if exists public.voyages cascade;
drop table if exists public.vessels cascade;
drop table if exists public.users cascade;
drop table if exists public.organizations cascade;

delete from auth.users;   -- removes every login (identities/sessions cascade)

-- ============================================================
-- STEP 1 — Organizations (tenants)
-- ============================================================
create table public.organizations (
  id text primary key,
  "companyName" text not null,
  address text,
  "licenseId" text,
  slug text,
  status text not null default 'active',
  "isPlatform" boolean not null default false,   -- true = OnePort Agency (the SaaS vendor)
  plan text not null default 'Professional',
  "planStatus" text not null default 'active',
  "planExpiry" text,
  "enabledModules" text[],                        -- null = all modules enabled
  "createdAt" timestamptz not null default now()
);

-- ============================================================
-- STEP 2 — Users profile (1:1 with auth.users)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'VIEWER' check (role in (
    'PLATFORM_SUPER_ADMIN','ORG_ADMIN','OPERATIONS_MANAGER','PORT_AGENT','SHIP_AGENT',
    'PROTECTIVE_AGENT','SUPERVISORY_AGENT','FINANCE','DOCUMENTATION','VIEWER'
  )),
  "organizationId" text not null default 'org-1' references public.organizations(id),
  "roleId" text,
  "isPlatformAdmin" boolean not null default false,
  "platformRole" text,
  "platformDepartment" text,
  "accountStatus" text not null default 'active',
  rating numeric,
  "completedTurnarounds" integer default 0,
  specialty text,
  phone text,
  locations text[],
  status text default 'Available'
);

-- ============================================================
-- STEP 3 — Roles, Permissions, and default grants
-- ============================================================
create table public.roles (
  id text primary key,
  key text not null,
  name text not null,
  description text,
  "isSystem" boolean not null default false,
  "organizationId" text references public.organizations(id) on delete cascade,
  "createdAt" timestamptz not null default now()
);

create table public.permissions (
  id text primary key,
  module text not null,
  action text not null,
  description text
);

create table public.role_permissions (
  "roleId" text not null references public.roles(id) on delete cascade,
  "permissionId" text not null references public.permissions(id) on delete cascade,
  primary key ("roleId", "permissionId")
);

alter table public.users
  add constraint users_roleId_fkey foreign key ("roleId") references public.roles(id) on delete set null;

insert into public.permissions (id, module, action, description)
select m || ':' || a, m, a, initcap(a) || ' ' || m
from (values
  ('dashboard'),('port_calls'),('planning'),('vessels'),('tasks'),('crew'),
  ('documents'),('expenses'),('invoices'),('tariffs'),('approvals'),('laytime'),
  ('partners'),('agents'),('messages'),('reports'),('notifications'),('settings'),
  ('users'),('roles'),('company'),('audit_logs')
) as modules(m)
cross join (values ('view'),('create'),('edit'),('delete'),('approve'),('manage')) as actions(a);

insert into public.roles (id, key, name, description, "isSystem", "organizationId") values
  ('role-platform-super-admin', 'PLATFORM_SUPER_ADMIN', 'Platform Super Admin', 'Full control across all organizations.', true, null),
  ('role-org-admin',            'ORG_ADMIN',            'Organization Admin',    'Full control within their organization.', true, null),
  ('role-operations-manager',   'OPERATIONS_MANAGER',   'Operations Manager',    'Oversees all operations, approvals and reports.', true, null),
  ('role-port-agent',           'PORT_AGENT',           'Port Agent',            'Manages port calls, vessels, tasks and documents.', true, null),
  ('role-ship-agent',           'SHIP_AGENT',           'Ship Agent',            'Manages port calls, laytime and disbursements.', true, null),
  ('role-protective-agent',     'PROTECTIVE_AGENT',     'Protective Agent',      'Oversees incidents, risk and cost audits.', true, null),
  ('role-supervisory-agent',    'SUPERVISORY_AGENT',    'Supervisory Agent',     'Operational oversight on behalf of the owner/charterer.', true, null),
  ('role-finance',              'FINANCE',              'Finance Officer',       'Invoices, disbursements, tariffs and approvals.', true, null),
  ('role-documentation',        'DOCUMENTATION',        'Documentation Officer', 'Documents, clearances and filings.', true, null),
  ('role-viewer',               'VIEWER',               'Viewer',                'Read-only access to operational data.', true, null);

-- Admin tiers: every permission.
insert into public.role_permissions ("roleId", "permissionId")
select r.id, p.id from public.roles r cross join public.permissions p
where r.id in ('role-platform-super-admin', 'role-org-admin', 'role-operations-manager');

-- Viewer: view-only on operational modules.
insert into public.role_permissions ("roleId", "permissionId")
select 'role-viewer', p.id from public.permissions p
where p.action = 'view'
  and p.module in ('dashboard','port_calls','planning','vessels','tasks','crew','documents','expenses','invoices','tariffs','laytime','partners','agents','messages','reports','notifications');

-- Agent / finance / documentation grants.
do $$
declare
  grants jsonb := '{
    "role-port-agent":       {"view":["dashboard","port_calls","planning","vessels","tasks","crew","documents","expenses","invoices","tariffs","approvals","partners","agents","messages","reports","notifications","settings"],"create":["port_calls","vessels","tasks","documents","expenses","invoices"],"edit":["port_calls","vessels","tasks","documents"],"delete":["tasks"]},
    "role-ship-agent":       {"view":["dashboard","port_calls","planning","vessels","crew","documents","expenses","invoices","tariffs","approvals","laytime","partners","agents","messages","reports","notifications","settings"],"create":["port_calls","expenses","invoices","laytime"],"edit":["port_calls","laytime","expenses"]},
    "role-protective-agent": {"view":["dashboard","port_calls","planning","vessels","tasks","crew","documents","expenses","invoices","tariffs","approvals","partners","agents","messages","reports","notifications","settings"],"create":["tasks"],"edit":["tasks"],"approve":["expenses"]},
    "role-supervisory-agent": {"view":["dashboard","port_calls","planning","vessels","tasks","crew","documents","expenses","invoices","tariffs","approvals","partners","agents","messages","reports","notifications","settings"]},
    "role-finance":          {"view":["dashboard","port_calls","expenses","invoices","tariffs","approvals","partners","reports","notifications","settings"],"create":["invoices","tariffs","expenses"],"edit":["invoices","tariffs","expenses"],"approve":["expenses","invoices"]},
    "role-documentation":    {"view":["dashboard","port_calls","vessels","crew","documents","partners","agents","messages","reports","notifications","settings"],"create":["documents"],"edit":["documents"],"delete":["documents"]}
  }'::jsonb;
  role_key text; action_key text; module_val text;
begin
  for role_key in select jsonb_object_keys(grants) loop
    for action_key in select jsonb_object_keys(grants->role_key) loop
      for module_val in select jsonb_array_elements_text(grants->role_key->action_key) loop
        insert into public.role_permissions ("roleId", "permissionId")
        values (role_key, module_val || ':' || action_key) on conflict do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- ============================================================
-- STEP 4 — Invitations
-- ============================================================
create table public.invitations (
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

-- ============================================================
-- STEP 5 — Operational tables (each tenant-scoped via organizationId)
-- ============================================================
create table public.vessels (
  id text primary key, "vesselName" text not null, "imoNumber" text not null, "callSign" text, flag text,
  "vesselType" text, "grossTonnage" numeric, deadweight numeric, "captainDetails" text, "crewCount" integer,
  eta text, etd text, "currentPort" text, "voyageNumber" text, status text,
  "assignedPortAgentId" text, "assignedPortAgentName" text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.voyages (
  id text primary key, "vesselId" text references public.vessels(id) on delete set null, "vesselName" text not null,
  "voyageNumber" text not null, "originPort" text, "destinationPort" text, eta text, etd text, etb text,
  "actualEta" text, "actualEtb" text, "actualEtd" text, "cargoType" text, "cargoQuantity" numeric, "cargoStatus" text,
  "loadingSchedule" text, "unloadingSchedule" text, "portAgentId" text, "shipAgentId" text, "protectiveAgentId" text,
  timeline jsonb not null default '[]', status text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.tasks (
  id text primary key, "voyageId" text references public.voyages(id) on delete cascade, "voyageNumber" text,
  title text not null, description text, "assignedTo" text, status text, "dueDate" text, category text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.documents (
  id text primary key, "voyageId" text references public.voyages(id) on delete cascade, "voyageNumber" text,
  "fileName" text not null, "fileSize" text, type text, "uploadedBy" text, "uploadedAt" text, version integer default 1, category text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.expenses (
  id text primary key, "voyageId" text references public.voyages(id) on delete cascade, "voyageNumber" text,
  amount numeric, "estimatedAmount" numeric, category text, status text, description text, "submittedBy" text, "submittedAt" text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.messages (
  id text primary key, "voyageId" text references public.voyages(id) on delete cascade, "senderId" text,
  "senderName" text, "senderRole" text, content text not null, timestamp text not null,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.notifications (
  id text primary key, "userId" text, message text not null, status text not null default 'Unread',
  "createdAt" text not null, type text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.incidents (
  id text primary key, "voyageId" text references public.voyages(id) on delete cascade, "voyageNumber" text,
  description text not null, severity text not null, status text not null default 'Open', "createdAt" text not null, "reportedBy" text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.audit_logs (
  id text primary key, "userId" text, "userName" text, action text not null, details text not null, timestamp text not null,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.laytime_calculations (
  id text primary key, "voyageId" text references public.voyages(id) on delete cascade, "voyageNumber" text, "vesselName" text,
  "cargoQuantity" numeric, "loadingRate" numeric, "demurrageRate" numeric, "despatchRate" numeric, "laytimeTerms" text,
  "sofEvents" jsonb not null default '[]', status text, "createdAt" text not null, "updatedAt" text not null,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.partners (
  id text primary key, name text not null,
  type text not null check (type in ('Principal', 'Vendor', 'Port Authority', 'Terminal', 'Client')),
  "contactName" text, email text, phone text, "portsCovered" text[], notes text, "createdAt" text not null,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.crew_members (
  id text primary key, "vesselId" text references public.vessels(id) on delete set null, "vesselName" text,
  "fullName" text not null, rank text not null, nationality text, "seamanBookNumber" text, "passportNumber" text,
  "signOnDate" text, "signOffDate" text, status text not null default 'Scheduled', "contactPhone" text, notes text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.tariffs (
  id text primary key, "serviceCategory" text not null, description text, port text,
  "vendorId" text references public.partners(id) on delete set null, "vendorName" text, rate numeric not null,
  currency text not null default 'USD', unit text not null, "effectiveDate" text not null, notes text,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

create table public.invoices (
  id text primary key, "invoiceNumber" text not null, "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text, "partnerId" text references public.partners(id) on delete set null, "partnerName" text,
  amount numeric not null, currency text not null default 'USD', status text not null default 'Draft',
  "issueDate" text not null, "dueDate" text not null, notes text, "createdBy" text, "createdAt" text not null,
  "organizationId" text not null default 'org-1' references public.organizations(id)
);

-- ============================================================
-- STEP 6 — Functions & triggers
-- ============================================================
create function public.current_user_org()
returns text language sql stable security definer set search_path = public as $$
  select "organizationId" from public.users where id = auth.uid()
$$;

create function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select "isPlatformAdmin" from public.users where id = auth.uid()), false)
$$;

create function public.has_permission(p_module text, p_action text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.users u
    join public.role_permissions rp on rp."roleId" = u."roleId"
    where u.id = auth.uid() and rp."permissionId" = p_module || ':' || p_action
  )
$$;

create function public.set_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new."organizationId" is null then new."organizationId" := public.current_user_org(); end if;
  return new;
end $$;

create function public.handle_new_user()
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

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare t text;
begin
  foreach t in array array[
    'vessels','voyages','tasks','documents','expenses','messages','notifications',
    'incidents','audit_logs','laytime_calculations','partners','crew_members','tariffs','invoices'
  ] loop
    execute format('create trigger set_org_id_trg before insert on public.%I for each row execute function public.set_org_id()', t);
  end loop;
end $$;

-- ============================================================
-- STEP 6b — Platform Owner protection (unique root account)
-- ============================================================
create unique index if not exists one_platform_owner
  on public.users ("platformRole") where "platformRole" = 'PLATFORM_OWNER';

create or replace function public.protect_platform_owner()
returns trigger language plpgsql security definer set search_path = public as $$
declare bypass boolean := coalesce(current_setting('app.allow_owner_change', true) = '1', false);
begin
  if tg_op = 'DELETE' then
    if old."platformRole" = 'PLATFORM_OWNER' and not bypass then
      raise exception 'Platform Owner cannot be deleted. Transfer ownership first.';
    end if;
    return old;
  end if;
  if old."platformRole" = 'PLATFORM_OWNER' and not bypass then
    if new."platformRole" is distinct from 'PLATFORM_OWNER' then raise exception 'Platform Owner role cannot be changed. Transfer ownership first.'; end if;
    if coalesce(new."accountStatus", 'active') <> 'active' then raise exception 'Platform Owner cannot be suspended or deactivated.'; end if;
    if new."isPlatformAdmin" is distinct from true then raise exception 'Platform Owner cannot be demoted.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_owner_trg on public.users;
create trigger protect_owner_trg before update or delete on public.users
  for each row execute function public.protect_platform_owner();

create or replace function public.transfer_platform_ownership(new_owner uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_owner uuid;
begin
  select id into current_owner from public.users where "platformRole" = 'PLATFORM_OWNER';
  if current_owner is null then raise exception 'There is no current Platform Owner.'; end if;
  if new_owner = current_owner then raise exception 'Choose a different user to transfer ownership to.'; end if;
  if (select "platformRole" from public.users where id = new_owner) is distinct from 'PLATFORM_STAFF' then
    raise exception 'Ownership can only be transferred to a Platform Staff member.';
  end if;
  perform set_config('app.allow_owner_change', '1', true);
  update public.users set "platformRole" = 'PLATFORM_STAFF', "isPlatformAdmin" = false where id = current_owner;
  update public.users set "platformRole" = 'PLATFORM_OWNER',  "isPlatformAdmin" = true  where id = new_owner;
  perform set_config('app.allow_owner_change', '0', true);
end $$;

revoke all on function public.transfer_platform_ownership(uuid) from public, anon, authenticated;

-- ============================================================
-- STEP 7 — Row-Level Security
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'vessels','voyages','tasks','documents','expenses','messages','notifications',
    'incidents','audit_logs','laytime_calculations','partners','crew_members','tariffs','invoices'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($f$create policy "tenant isolation" on public.%I for all
      using ("organizationId" = public.current_user_org() or public.is_platform_admin())
      with check ("organizationId" = public.current_user_org() or public.is_platform_admin())$f$, t);
  end loop;
end $$;

alter table public.organizations enable row level security;
create policy "org visibility" on public.organizations for select
  using (id = public.current_user_org() or public.is_platform_admin());
create policy "org admin write" on public.organizations for all
  using (public.is_platform_admin() or (id = public.current_user_org() and public.has_permission('company','manage')))
  with check (public.is_platform_admin() or (id = public.current_user_org() and public.has_permission('company','manage')));

alter table public.users enable row level security;
create policy "org members" on public.users for select
  using ("organizationId" = public.current_user_org() or public.is_platform_admin() or id = auth.uid());
create policy "self or admin update" on public.users for update
  using (id = auth.uid() or public.is_platform_admin() or public.has_permission('users','manage'))
  with check (id = auth.uid() or public.is_platform_admin() or public.has_permission('users','manage'));

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
create policy "read roles" on public.roles for select using (auth.role() = 'authenticated');
create policy "write roles" on public.roles for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "read permissions" on public.permissions for select using (auth.role() = 'authenticated');
create policy "read role_permissions" on public.role_permissions for select using (auth.role() = 'authenticated');
create policy "write role_permissions" on public.role_permissions for all using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.invitations enable row level security;
create policy "org invitations" on public.invitations for all
  using (public.is_platform_admin() or ("organizationId" = public.current_user_org() and public.has_permission('users','manage')))
  with check (public.is_platform_admin() or ("organizationId" = public.current_user_org() and public.has_permission('users','manage')));

-- ============================================================
-- STEP 8 — Your first organization
-- ============================================================
-- org-1 is OnePort Agency, the SaaS vendor (platform company) — NOT a customer.
insert into public.organizations (id, "companyName", slug, "isPlatform", plan, "planStatus")
values ('org-1', 'OnePort Agency', 'oneport-agency', true, 'Platform', 'internal');

-- ============================================================
-- STEP 9 — Your admin login  ←←← CHANGE THE 3 VALUES BELOW
-- ============================================================
do $$
declare
  v_name     text := 'Your Name';                    -- «CHANGE THIS»
  v_email    text := 'you@example.com';              -- «CHANGE THIS»
  v_password text := 'ChangeThisPassword123';        -- «CHANGE THIS»
  v_uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    lower(v_email), crypt(v_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', v_name, 'role', 'PLATFORM_SUPER_ADMIN', 'organizationId', 'org-1', 'isPlatformAdmin', true, 'platformRole', 'PLATFORM_OWNER'),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_uid::text, v_uid, jsonb_build_object('sub', v_uid::text, 'email', lower(v_email)), 'email', now(), now(), now());
end $$;

-- Done. Sign in to the app with the email + password you set above.
