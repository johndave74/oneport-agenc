-- =====================================================================
-- OnePort Agency — Organization subscriptions (subscription awareness)
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- Customer organizations carry a plan the Org Admin can VIEW but not manage
-- (plans are assigned platform-side). enabledModules gates which modules a
-- tenant can use; NULL means "all modules enabled".
-- =====================================================================

alter table public.organizations add column if not exists plan text not null default 'Professional';
alter table public.organizations add column if not exists "planStatus" text not null default 'active';
alter table public.organizations add column if not exists "planExpiry" text;         -- ISO date, or null = no expiry
alter table public.organizations add column if not exists "enabledModules" text[];    -- null = all modules

-- The platform company is not a customer tenant — mark it distinctly.
update public.organizations set plan = 'Platform', "planStatus" = 'internal' where "isPlatform" = true;
