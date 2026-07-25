-- =====================================================================
-- OnePort Agency — Expense approval routing
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- An expense (PDA/FDA line) can be routed to a specific approver, who is
-- notified. submittedById lets us notify the submitter of the decision.
-- =====================================================================

alter table public.expenses add column if not exists "approverId" text;
alter table public.expenses add column if not exists "approverName" text;
alter table public.expenses add column if not exists "submittedById" text;
