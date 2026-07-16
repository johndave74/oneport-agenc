# Phase 2 — Multi-tenant + RBAC + Invitation Auth

Scope agreed: **Organizations with data isolation**, a **roles/permissions model that drives navigation**, and **invitation-only onboarding**. Branches & Departments are deferred to a later migration.

I cannot run migrations against your hosted Supabase, so **you apply them**; this document is the design + the exact apply order. The frontend auth/nav cutover is the step *after* you apply — see the last section.

---

## 1. What the migration adds

File: [`migrations/20260718000000_multitenant_rbac.sql`](migrations/20260718000000_multitenant_rbac.sql)

| Concern | How |
|---|---|
| **Tenant record** | `organizations` gains `slug`, `status`, `createdAt`. |
| **Roles** | New `roles` table + 9 seeded system roles (Platform Super Admin → Viewer). |
| **Permissions** | `permissions` = every `module × action` (22 modules × 6 actions); `role_permissions` maps roles → permissions; sensible defaults seeded per role. |
| **User linkage** | `users` gains `roleId`, `isPlatformAdmin`, `accountStatus`; legacy `role` text kept in sync and its CHECK widened to all 9 keys. |
| **Invitations** | `invitations` table (email, org, role, token, status, expiry). |
| **Tenant isolation** | `organizationId` added to all 14 operational tables + backfilled to `org-1`; a `BEFORE INSERT` trigger auto-stamps it, so **existing client code needs no change**. |
| **RLS** | Blanket `authenticated` policies replaced with `organizationId = current_user_org()` (or platform admin). Helper SQL fns: `current_user_org()`, `is_platform_admin()`, `has_permission()`. |
| **Onboarding** | `handle_new_user()` now reads org + role from invite metadata and links `roleId`. |

The migration is **idempotent and backward-compatible** — all current data becomes `org-1`, all current users keep their role, the app keeps working.

## 2. The Edge Function

File: [`functions/admin/index.ts`](functions/admin/index.ts) — runs as service role, authorises the *caller* first. Actions:

- `invite_create` — org admin (needs `users:manage`) invites an email; sends Supabase invite, records the invitation.
- `invite_accept` — closes out the invitation after the invitee sets a password.
- `reset_workspace` — **platform admin only**, requires `{ confirm: "RESET" }`, clears operational tables for one org (never identity tables, never all orgs). This is your "reset via backend, not the UI" request.

## 3. Apply order (you run these)

```bash
# From the repo root, against your linked project:
supabase db push                     # applies 20260718000000_multitenant_rbac.sql
supabase functions deploy admin      # deploys the Edge Function
supabase secrets set APP_URL=https://<your-app-url>   # for invite redirect links
```

Or paste the migration into the **Supabase SQL Editor** and run it, then deploy the function from the dashboard. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically for Edge Functions.

**Bootstrap the first platform admin** (one-time, SQL editor):

```sql
update public.users
set "isPlatformAdmin" = true,
    role = 'PLATFORM_SUPER_ADMIN',
    "roleId" = 'role-platform-super-admin'
where email = 'you@yourcompany.com';
```

## 4. Verify

```sql
select key, name from public.roles order by name;                    -- 9 roles
select count(*) from public.permissions;                             -- 132
select current_user_org();                                           -- your org (run as an authed user)
select "organizationId", count(*) from public.voyages group by 1;    -- all org-1
```

Then log in as a normal org user and confirm you still see your data (RLS lets `org-1` users read `org-1` rows), and as a second org's user (once created) confirm you **cannot**.

## 5. Frontend cutover — the next step (after you've applied the above)

The DB is now the source of truth; the client currently still uses the hardcoded `ROLE_ALLOWED_VIEWS`. The additive groundwork is already in the repo and safe to ship now:

- `src/types/index.ts` — `Role`, `Permission`, `Invitation`, `RoleKey`, extended `User`/`Organization`.
- `src/lib/rbac/permissions.ts` — module/action catalogue, per-role defaults (mirrors the SQL), and `navFromPermissions()` / `can()` / `allowedViews()`.

Once you confirm the migration is applied, the cutover I'll do next is:

1. **Load grants on login** — fetch the user's `role_permissions` (+ `roles`) into session state; fall back to `defaultPermissionsForRole()` if empty.
2. **Permission-driven nav** — `Sidebar` and `App`'s view-guard read `navFromPermissions()` / `allowedViews()` instead of `ROLE_ALLOWED_VIEWS`.
3. **Invitation auth** — disable public signup in `AuthView`; add an **Accept Invite** page (`/accept-invite`) that sets the password via `supabase.auth.updateUser` then calls `invite_accept`; add an **Org Admin → Users** screen that calls `invite_create`.
4. **Org context** — surface the current organization in the header; scope any remaining client-side org references.

I kept this cutover out of this pass on purpose: wiring the UI to the new tables **before** you apply the migration would break the running app against the current schema.

## 6. Deferred (next architecture slice)
Branches & Departments (org sub-hierarchy), org-scoped **custom** roles, and per-permission RLS on write actions.
