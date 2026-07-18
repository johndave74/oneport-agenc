-- =====================================================================
-- OnePort Agency — mark the platform company vs customer organizations
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- OnePort Agency (org-1) is the SaaS vendor, NOT a customer tenant. This flag
-- lets the app keep platform staff attached to org-1 while hiding it from the
-- customer Organizations list. Customer organizations have isPlatform = false.
-- =====================================================================

alter table public.organizations add column if not exists "isPlatform" boolean not null default false;

update public.organizations set "isPlatform" = true where id = 'org-1';
