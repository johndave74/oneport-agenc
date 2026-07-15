-- OnePort Agency: core schema
--
-- Column names are quoted camelCase to match the TypeScript types in
-- src/types/index.ts exactly, so the client can read/write rows with no
-- field-name mapping layer.
--
-- Every table (except organizations, whose id is app-assigned) uses a
-- text primary key populated by the client, e.g. `ves-${Date.now()}`,
-- matching the id-generation convention already used throughout the app.
-- public.users is the one exception: its id must equal the corresponding
-- auth.users id (see handle_new_user() below).

-- ============================================================
-- Organizations
-- ============================================================
create table public.organizations (
  id text primary key,
  "companyName" text not null
);

-- ============================================================
-- Users (profile row, 1:1 with auth.users)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('PORT_AGENT', 'SHIP_AGENT', 'PROTECTIVE_AGENT', 'ADMIN')),
  "organizationId" text not null default 'org-1' references public.organizations(id),
  rating numeric,
  "completedTurnarounds" integer default 0,
  specialty text,
  phone text,
  locations text[],
  status text default 'Available'
);

-- Auto-create a public.users profile whenever someone signs up via
-- Supabase Auth. Role/name/organizationId are passed as user metadata
-- from the client's supabase.auth.signUp({ options: { data } }) call.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, role, "organizationId")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'PORT_AGENT'),
    coalesce(new.raw_user_meta_data->>'organizationId', 'org-1')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Vessels
-- ============================================================
create table public.vessels (
  id text primary key,
  "vesselName" text not null,
  "imoNumber" text not null,
  "callSign" text,
  flag text,
  "vesselType" text,
  "grossTonnage" numeric,
  deadweight numeric,
  "captainDetails" text,
  "crewCount" integer,
  eta text,
  etd text,
  "currentPort" text,
  "voyageNumber" text,
  status text,
  "assignedPortAgentId" text,
  "assignedPortAgentName" text
);

-- ============================================================
-- Voyages
-- ============================================================
create table public.voyages (
  id text primary key,
  "vesselId" text references public.vessels(id) on delete set null,
  "vesselName" text not null,
  "voyageNumber" text not null,
  "originPort" text,
  "destinationPort" text,
  eta text,
  etd text,
  etb text,
  "actualEta" text,
  "actualEtb" text,
  "actualEtd" text,
  "cargoType" text,
  "cargoQuantity" numeric,
  "cargoStatus" text,
  "loadingSchedule" text,
  "unloadingSchedule" text,
  "portAgentId" text,
  "shipAgentId" text,
  "protectiveAgentId" text,
  timeline jsonb not null default '[]',
  status text
);

-- ============================================================
-- Tasks
-- ============================================================
create table public.tasks (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  title text not null,
  description text,
  "assignedTo" text,
  status text,
  "dueDate" text
);

-- ============================================================
-- Documents
-- ============================================================
create table public.documents (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  "fileName" text not null,
  "fileSize" text,
  type text,
  "uploadedBy" text,
  "uploadedAt" text,
  version integer default 1,
  category text
);

-- ============================================================
-- Expenses
-- ============================================================
create table public.expenses (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  amount numeric,
  "estimatedAmount" numeric,
  category text,
  status text,
  description text,
  "submittedBy" text,
  "submittedAt" text
);

-- ============================================================
-- Messages
-- ============================================================
create table public.messages (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "senderId" text,
  "senderName" text,
  "senderRole" text,
  content text not null,
  timestamp text not null
);

-- ============================================================
-- Notifications
-- ============================================================
create table public.notifications (
  id text primary key,
  "userId" text,
  message text not null,
  status text not null default 'Unread',
  "createdAt" text not null,
  type text
);

-- ============================================================
-- Incidents
-- ============================================================
create table public.incidents (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  description text not null,
  severity text not null,
  status text not null default 'Open',
  "createdAt" text not null,
  "reportedBy" text
);

-- ============================================================
-- Audit logs
-- ============================================================
create table public.audit_logs (
  id text primary key,
  "userId" text,
  "userName" text,
  action text not null,
  details text not null,
  timestamp text not null
);

-- ============================================================
-- Laytime calculations
-- ============================================================
create table public.laytime_calculations (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  "vesselName" text,
  "cargoQuantity" numeric,
  "loadingRate" numeric,
  "demurrageRate" numeric,
  "despatchRate" numeric,
  "laytimeTerms" text,
  "sofEvents" jsonb not null default '[]',
  status text,
  "createdAt" text not null,
  "updatedAt" text not null
);

-- ============================================================
-- Row-Level Security
--
-- Any authenticated agent can read/write any row. This matches the
-- current app's behavior (no server-side per-role restriction; role
-- gating is enforced client-side via ROLE_ALLOWED_VIEWS). Tighten with
-- organizationId-scoped policies if this grows beyond a single tenant.
-- ============================================================
alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.vessels enable row level security;
alter table public.voyages enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.expenses enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.laytime_calculations enable row level security;

create policy "authenticated read/write" on public.organizations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.users for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.vessels for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.voyages for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.messages for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.incidents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.audit_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.laytime_calculations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
