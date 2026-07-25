-- =====================================================================
-- OnePort Agency — Organization soft delete (Trash)
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- Soft delete moves an org to Trash (deletedAt set) without removing rows,
-- so it works even when the org has users/data. Restore clears deletedAt.
-- Permanent purge (remove users + data + org) is done by the admin Edge
-- Function, platform-admin only.
-- =====================================================================

alter table public.organizations add column if not exists "deletedAt" timestamptz;
alter table public.organizations add column if not exists "deletedBy" text;
