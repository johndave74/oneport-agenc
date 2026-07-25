-- =====================================================================
-- OnePort Agency — Real document storage (Supabase Storage)
-- ---------------------------------------------------------------------
-- Run in the Supabase SQL Editor. Additive and idempotent.
--
-- Creates a private 'documents' bucket, org-scoped access policies (files
-- live under <organizationId>/... so tenants only touch their own), and adds
-- storagePath/mimeType to the documents table.
-- =====================================================================

alter table public.documents add column if not exists "storagePath" text;
alter table public.documents add column if not exists "mimeType" text;

-- Private bucket for uploaded files.
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Tenant-scoped access: the first path segment must be the caller's org.
drop policy if exists "documents org read" on storage.objects;
drop policy if exists "documents org insert" on storage.objects;
drop policy if exists "documents org delete" on storage.objects;

create policy "documents org read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (public.is_platform_admin() or split_part(name, '/', 1) = public.current_user_org()));

create policy "documents org insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (public.is_platform_admin() or split_part(name, '/', 1) = public.current_user_org()));

create policy "documents org delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (public.is_platform_admin() or split_part(name, '/', 1) = public.current_user_org()));
