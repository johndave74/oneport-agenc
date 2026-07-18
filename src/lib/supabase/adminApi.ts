// Thin client wrapper around the `admin` Edge Function (service-role backend).
// The browser never holds the service key — it invokes the function, which
// authorises the caller from their session before acting.

import { supabase } from '@/lib/supabase/client';

// Turn raw server/Supabase errors into clear, human messages.
function friendly(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('already been registered') || m.includes('already registered') || m.includes('already exists') || m.includes('duplicate')) return 'That email address is already registered.';
  if (m.includes('unknown action')) return 'The admin function is out of date. Redeploy it (Supabase → Edge Functions → admin), then try again.';
  if (m.includes('service role') || m.includes('service_role')) return 'Server is missing its service key (SUPABASE_SERVICE_ROLE_KEY). Set it in the Edge Function secrets.';
  if (m.includes('forbidden') || m.includes('permission')) return "You don't have permission to do that.";
  if (m.includes('unauthorized') || m.includes('jwt') || m.includes('token')) return 'Your session has expired. Please sign in again.';
  if (m.includes('password') && (m.includes('8') || m.includes('short') || m.includes('least'))) return 'Password must be at least 8 characters.';
  if (m.includes('organization')) return raw; // "Select an organization", "Organization not found"
  if (m.includes('failed to fetch') || m.includes('networkerror')) return 'Could not reach the admin function. Check it is deployed.';
  return raw || 'Unexpected server error.';
}

// supabase-js reports a GENERIC message on non-2xx and does not read the JSON
// body — so we pull the real error out of error.context (the Response).
async function readError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof (ctx as Response).clone === 'function') {
    try {
      const body = await (ctx as Response).clone().json();
      if (body && typeof body === 'object' && 'error' in body && body.error) return String(body.error);
    } catch {
      try { const t = await (ctx as Response).text(); if (t) return t; } catch { /* ignore */ }
    }
  }
  return (error as { message?: string })?.message || 'Request failed';
}

async function invoke<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin', { body });
  if (error) throw new Error(friendly(await readError(error)));
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(friendly(String((data as { error: unknown }).error)));
  }
  return data as T;
}

export interface InviteInput {
  email: string;
  roleKey: string;
  name?: string;
  organizationId?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  roleKey: string;
  name?: string;
  organizationId?: string;
  platformRole?: string;
  platformDepartment?: string;
}

export const AdminApi = {
  createUser: (input: CreateUserInput) => invoke<{ ok: boolean; userId?: string; email: string }>({ action: 'user_create', ...input }),
  resetPassword: (userId: string, password: string) => invoke({ action: 'user_reset_password', userId, password }),
  deleteUser: (userId: string) => invoke({ action: 'user_delete', userId }),
  transferOwnership: (newOwnerId: string) => invoke({ action: 'transfer_ownership', newOwnerId }),
  inviteUser: (input: InviteInput) => invoke({ action: 'invite_create', ...input }),
  acceptInvite: () => invoke({ action: 'invite_accept' }),
  resetWorkspace: (organizationId?: string) => invoke({ action: 'reset_workspace', confirm: 'RESET', organizationId }),
};
