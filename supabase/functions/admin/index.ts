// OnePort Agency — admin Edge Function (service-role, never call from the client
// with the service key). Handles the privileged operations that must not live in
// the browser: sending invitations, marking them accepted, and the guarded
// workspace reset/reseed.
//
// Deploy:  supabase functions deploy admin
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and APP_URL are provided by
//          the platform / `supabase secrets set APP_URL=https://your-app`.
//
// Every action authenticates the *caller* from their Authorization bearer token
// and checks their profile flags — the service-role client is only used to
// perform the action once the caller is authorised.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Operational tables cleared by a reset. Reference/identity tables (orgs,
// users, roles, permissions) are deliberately NOT touched.
const OPERATIONAL_TABLES = [
  'laytime_calculations', 'incidents', 'messages', 'documents', 'expenses',
  'invoices', 'tasks', 'tariffs', 'crew_members', 'partners', 'voyages',
  'vessels', 'notifications', 'audit_logs',
];

interface Caller {
  id: string;
  organizationId: string;
  isPlatformAdmin: boolean;
  roleId: string | null;
}

async function getCaller(admin: ReturnType<typeof createClient>, authHeader: string | null): Promise<Caller | null> {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return null;
  const { data: profile } = await admin
    .from('users')
    .select('id, "organizationId", "isPlatformAdmin", "roleId"')
    .eq('id', userData.user.id)
    .single();
  if (!profile) return null;
  return profile as unknown as Caller;
}

async function hasUserManage(admin: ReturnType<typeof createClient>, caller: Caller): Promise<boolean> {
  if (caller.isPlatformAdmin) return true;
  if (!caller.roleId) return false;
  const { data } = await admin
    .from('role_permissions')
    .select('"permissionId"')
    .eq('roleId', caller.roleId)
    .eq('permissionId', 'users:manage')
    .maybeSingle();
  return Boolean(data);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let payload: { action?: string; [k: string]: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const action = payload.action;

  try {
    // ---------------------------------------------------- invite_create
    if (action === 'invite_create') {
      const caller = await getCaller(admin, req.headers.get('Authorization'));
      if (!caller) return json({ error: 'Unauthorized' }, 401);
      if (!(await hasUserManage(admin, caller))) return json({ error: 'Forbidden — requires users:manage' }, 403);

      const email = String(payload.email ?? '').trim().toLowerCase();
      const roleKey = String(payload.roleKey ?? 'VIEWER');
      const name = String(payload.name ?? email.split('@')[0]);
      // Platform admins may target another org; everyone else is pinned to theirs.
      const organizationId = caller.isPlatformAdmin && payload.organizationId
        ? String(payload.organizationId)
        : caller.organizationId;
      if (!email) return json({ error: 'email is required' }, 400);

      const { data: role } = await admin.from('roles').select('id').eq('key', roleKey).is('organizationId', null).maybeSingle();

      // Create the auth user + email them an invite link. handle_new_user()
      // builds the profile from this metadata; the invitee sets their password
      // on the accept page (supabase.auth.updateUser).
      const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name, role: roleKey, organizationId },
        redirectTo: APP_URL ? `${APP_URL}/accept-invite` : undefined,
      });
      if (inviteErr) return json({ error: inviteErr.message }, 400);

      const id = `invite-${Date.now()}`;
      const token = crypto.randomUUID();
      await admin.from('invitations').insert({
        id, email, organizationId, roleId: role?.id ?? null,
        invitedBy: caller.id, token, status: 'pending',
      });
      return json({ ok: true, id, email });
    }

    // ---------------------------------------------------- invite_accept
    // Called by the accept page after the invitee sets a password, to close
    // out the invitation record. Caller is the newly-signed-in invitee.
    if (action === 'invite_accept') {
      const caller = await getCaller(admin, req.headers.get('Authorization'));
      if (!caller) return json({ error: 'Unauthorized' }, 401);
      const { data: userRow } = await admin.from('users').select('email').eq('id', caller.id).single();
      const email = (userRow?.email ?? '').toLowerCase();
      await admin
        .from('invitations')
        .update({ status: 'accepted', acceptedAt: new Date().toISOString() })
        .eq('email', email)
        .eq('status', 'pending');
      return json({ ok: true });
    }

    // ---------------------------------------------------- reset_workspace
    if (action === 'reset_workspace') {
      const caller = await getCaller(admin, req.headers.get('Authorization'));
      if (!caller) return json({ error: 'Unauthorized' }, 401);
      if (!caller.isPlatformAdmin) return json({ error: 'Forbidden — platform admin only' }, 403);
      if (payload.confirm !== 'RESET') return json({ error: 'Pass { confirm: "RESET" } to proceed' }, 400);

      // Platform admin resets a specific org (default: their own). Never all orgs.
      const org = String(payload.organizationId ?? caller.organizationId);
      const cleared: Record<string, number> = {};
      for (const table of OPERATIONAL_TABLES) {
        const { count } = await admin.from(table).delete({ count: 'exact' }).eq('organizationId', org);
        cleared[table] = count ?? 0;
      }
      return json({ ok: true, organizationId: org, cleared });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
});
