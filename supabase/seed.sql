-- Local dev seed data. Runs automatically on `supabase db reset`.
-- Creates the same three demo agents + starter vessel/voyage/task that
-- previously lived in src/lib/db/localDb.ts's DEFAULT_* constants.
--
-- Demo login (any of the three): password "demo1234"
--   sarah@oneport.demo    (SHIP_AGENT)
--   michael@oneport.demo  (PORT_AGENT)
--   elena@oneport.demo    (PROTECTIVE_AGENT)

create extension if not exists pgcrypto;

insert into public.organizations (id, "companyName") values
  ('org-1', 'Oneport Agenc');

-- Seed auth.users directly (local dev only). handle_new_user() fires on
-- insert and creates the matching public.users row automatically.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated',
    'sarah@oneport.demo', crypt('demo1234', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Sarah Jenkins","role":"SHIP_AGENT","organizationId":"org-1"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated',
    'michael@oneport.demo', crypt('demo1234', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Michael Chang","role":"PORT_AGENT","organizationId":"org-1"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated',
    'elena@oneport.demo', crypt('demo1234', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Elena Rodriguez","role":"PROTECTIVE_AGENT","organizationId":"org-1"}',
    now(), now(), '', '', '', ''
  );

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"sarah@oneport.demo"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"michael@oneport.demo"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"elena@oneport.demo"}', 'email', now(), now(), now());

-- Enrich the profiles handle_new_user() already created with demo stats.
update public.users set
  rating = 4.8, "completedTurnarounds" = 124, specialty = 'Tanker Operations',
  phone = '+1 555-0101', locations = array['Houston', 'Rotterdam'], status = 'Available'
where id = '11111111-1111-1111-1111-111111111111';

update public.users set
  rating = 4.9, "completedTurnarounds" = 312, specialty = 'Customs Clearance',
  phone = '+1 555-0202', locations = array['Singapore', 'Shanghai'], status = 'Busy'
where id = '22222222-2222-2222-2222-222222222222';

update public.users set
  rating = 5.0, "completedTurnarounds" = 89, specialty = 'Disbursements',
  phone = '+1 555-0303', locations = array['Dubai', 'Fujairah'], status = 'Available'
where id = '33333333-3333-3333-3333-333333333333';

insert into public.vessels (
  id, "vesselName", "imoNumber", "callSign", flag, "vesselType", "grossTonnage",
  deadweight, "captainDetails", "crewCount", eta, etd, "currentPort", "voyageNumber", status
) values (
  'v-1', 'MV TEMA', '9123456', 'TMA123', 'Panama', 'Bulk Carrier', 35000,
  60000, 'Cpt. Johansen', 22, '2026-07-15T08:00', '2026-07-18T18:00', 'At Sea', 'TMA-2601', 'Scheduled'
);

insert into public.voyages (
  id, "vesselId", "vesselName", "voyageNumber", "originPort", "destinationPort",
  eta, etd, "cargoType", "cargoQuantity", "cargoStatus", "loadingSchedule",
  "unloadingSchedule", status, timeline
) values (
  'voy-1', 'v-1', 'MV TEMA', 'TMA-2601', 'Houston', 'Rotterdam',
  '2026-07-15T08:00', '2026-07-18T18:00', 'Iron Ore', 50000, 'In Transit', 'N/A',
  '2026-07-16T08:00 - 2026-07-18T12:00', 'Scheduled',
  '[
    {"event": "Pre-arrival notice", "completed": true, "timestamp": "2026-07-08T10:00"},
    {"event": "Customs clearance", "completed": false, "timestamp": ""},
    {"event": "Pilot boarded", "completed": false, "timestamp": ""},
    {"event": "Berthing", "completed": false, "timestamp": ""}
  ]'::jsonb
);

insert into public.tasks (
  id, "voyageId", "voyageNumber", title, description, "assignedTo", status, "dueDate"
) values (
  't-1', 'voy-1', 'TMA-2601', 'Submit customs manifest',
  'Ensure all cargo manifests are submitted to customs before arrival.',
  'Michael Chang', 'Pending', '2026-07-14T12:00'
);
