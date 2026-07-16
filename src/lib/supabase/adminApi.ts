// Thin client wrapper around the `admin` Edge Function (service-role backend).
// The browser never holds the service key — it invokes the function, which
// authorises the caller from their session before acting.

import { supabase } from '@/lib/supabase/client';

async function invoke<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin', { body });
  if (error) throw new Error(error.message || 'Request failed');
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data as T;
}

export interface InviteInput {
  email: string;
  roleKey: string;
  name?: string;
  organizationId?: string;
}

export const AdminApi = {
  inviteUser: (input: InviteInput) => invoke({ action: 'invite_create', ...input }),
  acceptInvite: () => invoke({ action: 'invite_accept' }),
  resetWorkspace: (organizationId?: string) => invoke({ action: 'reset_workspace', confirm: 'RESET', organizationId }),
};
