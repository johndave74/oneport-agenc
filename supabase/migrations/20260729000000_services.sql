-- =====================================================================
-- OnePort Agency — Marine Services (booked against a port call)
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- A service (pilotage, tug, mooring, bunkering, fresh water, waste, customs…)
-- booked for a specific port call, optionally with a provider (Partner) and a
-- scheduled time. Tenant-scoped like every other operational table.
-- =====================================================================

create table if not exists public.services (
  id text primary key,
  "voyageId" text references public.voyages(id) on delete cascade,
  "voyageNumber" text,
  "serviceType" text not null,
  "providerId" text references public.partners(id) on delete set null,
  "providerName" text,
  "scheduledAt" text,
  status text not null default 'Requested',
  notes text,
  "organizationId" text not null default 'org-1' references public.organizations(id),
  "createdAt" text not null
);
create index if not exists services_org_idx on public.services ("organizationId");
create index if not exists services_voyage_idx on public.services ("voyageId");

alter table public.services enable row level security;
drop policy if exists "tenant isolation" on public.services;
create policy "tenant isolation" on public.services for all
  using ("organizationId" = public.current_user_org() or public.is_platform_admin())
  with check ("organizationId" = public.current_user_org() or public.is_platform_admin());

drop trigger if exists set_org_id_trg on public.services;
create trigger set_org_id_trg before insert on public.services for each row execute function public.set_org_id();
