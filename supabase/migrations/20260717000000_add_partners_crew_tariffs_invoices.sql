-- Adds four genuinely new entities requested for the full sidebar taxonomy:
-- Partners (one table covering Principal/Vendor/Port Authority/Terminal/Client
-- via a type column, rather than 5 near-identical tables), Crew Members,
-- Tariffs (rate card), and Invoices (a real persisted replacement for the
-- previous client-side-only mock invoice download). Also makes the
-- Organization "address"/"licenseId" fields real — they were previously
-- hardcoded, non-persisted display strings in SettingsView.

-- ============================================================
-- Organization: real address/license fields
-- ============================================================
alter table public.organizations add column address text;
alter table public.organizations add column "licenseId" text;

-- ============================================================
-- Partners
-- ============================================================
create table public.partners (
  id text primary key,
  name text not null,
  type text not null check (type in ('Principal', 'Vendor', 'Port Authority', 'Terminal', 'Client')),
  "contactName" text,
  email text,
  phone text,
  "portsCovered" text[],
  notes text,
  "createdAt" text not null
);

-- ============================================================
-- Crew members
-- ============================================================
create table public.crew_members (
  id text primary key,
  "vesselId" text references public.vessels(id) on delete set null,
  "vesselName" text,
  "fullName" text not null,
  rank text not null,
  nationality text,
  "seamanBookNumber" text,
  "passportNumber" text,
  "signOnDate" text,
  "signOffDate" text,
  status text not null default 'Scheduled',
  "contactPhone" text,
  notes text
);

-- ============================================================
-- Tariffs (rate card)
-- ============================================================
create table public.tariffs (
  id text primary key,
  "serviceCategory" text not null,
  description text,
  port text,
  "vendorId" text references public.partners(id) on delete set null,
  "vendorName" text,
  rate numeric not null,
  currency text not null default 'USD',
  unit text not null,
  "effectiveDate" text not null,
  notes text
);

-- ============================================================
-- Invoices
-- ============================================================
create table public.invoices (
  id text primary key,
  "invoiceNumber" text not null,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  "partnerId" text references public.partners(id) on delete set null,
  "partnerName" text,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'Draft',
  "issueDate" text not null,
  "dueDate" text not null,
  notes text,
  "createdBy" text,
  "createdAt" text not null
);

-- ============================================================
-- Row-Level Security (same blanket authenticated policy as every other table)
-- ============================================================
alter table public.partners enable row level security;
alter table public.crew_members enable row level security;
alter table public.tariffs enable row level security;
alter table public.invoices enable row level security;

create policy "authenticated read/write" on public.partners for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.crew_members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.tariffs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on public.invoices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
