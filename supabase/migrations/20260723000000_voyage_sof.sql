-- =====================================================================
-- OnePort Agency — Statement of Facts on port calls
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- SOF events (timestamped port-call events with a countable %) live directly
-- on the voyage/port call. They drive laytime/demurrage.
-- =====================================================================

alter table public.voyages add column if not exists "sofEvents" jsonb not null default '[]';
