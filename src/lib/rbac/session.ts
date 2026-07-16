// Loads the signed-in user's effective permission set for the session.
//
// Source of truth is the database (`role_permissions` for the user's roleId,
// or all-permissions for a platform admin). If a user has no roleId yet, or the
// grants haven't loaded, we fall back to the role's documented defaults so the
// UI never renders empty navigation.

import { supabase } from '@/lib/supabase/client';
import { User, RoleKey } from '@/types';
import { Permission, defaultPermissionsForRole, MODULES, ACTIONS, perm } from './permissions';

export async function loadPermissions(user: User): Promise<Set<Permission>> {
  if (user.isPlatformAdmin) {
    const all = new Set<Permission>();
    MODULES.forEach((m) => ACTIONS.forEach((a) => all.add(perm(m, a))));
    return all;
  }

  if (user.roleId) {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permissionId')
      .eq('roleId', user.roleId);
    if (!error && data && data.length) {
      return new Set(data.map((r: { permissionId: string }) => r.permissionId as Permission));
    }
  }

  return defaultPermissionsForRole(user.role as RoleKey);
}
