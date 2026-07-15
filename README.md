# OnePort Agency (Maritime OS) - Database & Project Setup Guide

OnePort Agency is a highly customized, multi-role Port Agency Management System built to streamline vessel operations, cargo dispatch, task coordination, document handovers, financial disbursements, and collaborative communication between maritime stakeholders.

Data is persisted in [Supabase](https://supabase.com) (Postgres + Auth). The full schema lives in [`supabase/migrations/`](supabase/migrations) as versioned SQL, so any Supabase project — local or cloud — can be brought up to the same state with one command.

---

## 🗄️ Setting Up Your Supabase Project

### Option A: Local development (Supabase CLI)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.

```bash
supabase start        # boots local Postgres, Auth, and Studio in Docker
supabase db reset      # applies supabase/migrations/ and supabase/seed.sql
```

`supabase start` prints a local API URL and anon key — copy those into `.env` (see below). `db reset` also seeds three demo agents (password `demo1234` for all):

| Role | Email |
|---|---|
| Ship Agent | sarah@oneport.demo |
| Port Agent | michael@oneport.demo |
| Protective Agent | elena@oneport.demo |

Local Studio (table editor, SQL runner, auth users) is available at the URL printed by `supabase start` (typically `http://localhost:54323`).

### Option B: Cloud project

1. Create a project at [supabase.com](https://supabase.com) and note its **Project URL** and **anon public key** from **Project Settings → API**.
2. Push the schema:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   (Or paste the contents of `supabase/migrations/*.sql` into the SQL Editor and run them, in order, if you'd rather not use the CLI.)
3. Optionally run `supabase/seed.sql` too, for the same demo agents/data as local dev.

### Configure environment variables

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Without these set, the app boots but shows a "Supabase isn't configured" notice on the sign-in screen instead of failing silently.

---

## 🔑 Authentication

Login and signup go through real Supabase Auth (`supabase.auth.signInWithPassword` / `signUp`) — not a mock. A Postgres trigger (`handle_new_user`, see the migration) automatically creates a matching `public.users` profile row whenever someone signs up, using the name/role passed at signup.

New operator accounts are created by the operator themselves via **"Create an account"** on the sign-in screen — an admin cannot fabricate another person's login from the client, since that would require a privileged service-role key that must never ship in browser code. Once someone signs up, an Admin can assign their role from the Admin view.

---

## 💻 Local Testing & Dev Commands

The system is built as a React Single-Page Application (SPA) powered by Vite.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Developer Mode
```bash
npm run dev
```
The application runs on `http://localhost:3000`.

### 3. Verify Code Quality (Linter & Build)
```bash
npm run lint
npm run build
```
This compiles the application and deposits the static build assets in the `/dist` directory, fully ready for distribution or static host upload.
