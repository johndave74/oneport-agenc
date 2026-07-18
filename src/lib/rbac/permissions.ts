// OnePort Agency — RBAC catalogue (frontend source of truth).
//
// This mirrors the seed data in supabase/migrations/20260718000000_multitenant_rbac.sql.
// It exists so the client can build permission-driven navigation and gate UI
// without a round-trip for every check. At runtime the authoritative grants come
// from the `role_permissions` table (loaded once per session); this module
// provides the module/action vocabulary, the default grants per system role,
// and helpers to turn a permission set into navigation.
//
// Keep this in sync with the SQL seed. If they diverge, the database wins.

import { RoleKey, PermissionAction } from '@/types';

export type ModuleId =
  | 'dashboard' | 'port_calls' | 'planning' | 'vessels' | 'tasks' | 'crew'
  | 'documents' | 'expenses' | 'invoices' | 'tariffs' | 'approvals' | 'laytime'
  | 'partners' | 'agents' | 'messages' | 'reports' | 'notifications' | 'settings'
  | 'users' | 'roles' | 'company' | 'audit_logs';

export const MODULES: ModuleId[] = [
  'dashboard', 'port_calls', 'planning', 'vessels', 'tasks', 'crew',
  'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'laytime',
  'partners', 'agents', 'messages', 'reports', 'notifications', 'settings',
  'users', 'roles', 'company', 'audit_logs',
];

export const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'manage'];

export type Permission = `${ModuleId}:${PermissionAction}`;
export const perm = (m: ModuleId, a: PermissionAction): Permission => `${m}:${a}`;

// Maps a module to the app's router view id, its sidebar label, and its group.
// This replaces the hardcoded ROLE_ALLOWED_VIEWS once nav goes permission-driven.
interface ModuleMeta {
  view: string;
  label: string;
  group: 'Operations' | 'Commercial' | 'Marine Operations' | 'Documents & Partners' | 'Reports & Analytics' | 'Administration' | 'Account' | 'Top';
}

export const MODULE_META: Record<ModuleId, ModuleMeta> = {
  dashboard:     { view: 'dashboard', label: 'Dashboard',            group: 'Top' },
  port_calls:    { view: 'voyages',   label: 'Port Calls',           group: 'Operations' },
  planning:      { view: 'planning',  label: 'Planning Centre',      group: 'Operations' },
  vessels:       { view: 'vessels',   label: 'Vessel Registry',      group: 'Operations' },
  tasks:         { view: 'tasks',     label: 'Tasks',                group: 'Operations' },
  expenses:      { view: 'expenses',  label: 'Disbursements',        group: 'Commercial' },
  invoices:      { view: 'invoices',  label: 'Invoices',             group: 'Commercial' },
  tariffs:       { view: 'tariffs',   label: 'Tariffs',              group: 'Commercial' },
  approvals:     { view: 'approvals', label: 'Approvals',            group: 'Commercial' },
  laytime:       { view: 'laytime',   label: 'Laytime & Demurrage',  group: 'Marine Operations' },
  crew:          { view: 'crew',      label: 'Crew Management',      group: 'Marine Operations' },
  documents:     { view: 'documents', label: 'Documents',            group: 'Documents & Partners' },
  agents:        { view: 'crm',       label: 'Agents',               group: 'Documents & Partners' },
  partners:      { view: 'partners',  label: 'Partners',             group: 'Documents & Partners' },
  messages:      { view: 'messages',  label: 'Communications',       group: 'Documents & Partners' },
  reports:       { view: 'reports',   label: 'Reports & Analytics',  group: 'Reports & Analytics' },
  users:         { view: 'admin',     label: 'Users & Roles',        group: 'Administration' },
  roles:         { view: 'admin',     label: 'Roles & Permissions',  group: 'Administration' },
  company:       { view: 'company',   label: 'Company',              group: 'Administration' },
  audit_logs:    { view: 'auditlogs', label: 'Audit Logs',           group: 'Administration' },
  notifications: { view: 'notifications', label: 'Notifications',    group: 'Account' },
  settings:      { view: 'settings',  label: 'Settings',             group: 'Account' },
};

const ALL_VIEW: ModuleId[] = [
  'dashboard', 'port_calls', 'planning', 'vessels', 'tasks', 'crew', 'documents',
  'expenses', 'invoices', 'tariffs', 'laytime', 'partners', 'agents', 'messages',
  'reports', 'notifications', 'settings',
];

// Default view-grants per system role (mirrors the SQL seed's `view` sets).
// Non-view actions are omitted here — the UI only needs `view` for navigation;
// action-level gating reads live grants from role_permissions.
const ROLE_VIEW_MODULES: Record<RoleKey, ModuleId[]> = {
  PLATFORM_SUPER_ADMIN: [...MODULES],
  ORG_ADMIN: [...MODULES],
  OPERATIONS_MANAGER: [...MODULES],
  PORT_AGENT: ['dashboard', 'port_calls', 'planning', 'vessels', 'tasks', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'partners', 'agents', 'messages', 'reports', 'notifications', 'settings'],
  SHIP_AGENT: ['dashboard', 'port_calls', 'planning', 'vessels', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'laytime', 'partners', 'agents', 'messages', 'reports', 'notifications', 'settings'],
  PROTECTIVE_AGENT: ['dashboard', 'port_calls', 'planning', 'vessels', 'tasks', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'partners', 'agents', 'messages', 'reports', 'notifications', 'settings'],
  SUPERVISORY_AGENT: ['dashboard', 'port_calls', 'planning', 'vessels', 'tasks', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'partners', 'agents', 'messages', 'reports', 'notifications', 'settings'],
  FINANCE: ['dashboard', 'port_calls', 'expenses', 'invoices', 'tariffs', 'approvals', 'partners', 'reports', 'notifications', 'settings'],
  DOCUMENTATION: ['dashboard', 'port_calls', 'vessels', 'crew', 'documents', 'partners', 'agents', 'messages', 'reports', 'notifications', 'settings'],
  VIEWER: ALL_VIEW,
};

/** Default `view` permission set for a system role (fallback before live grants load). */
export function defaultPermissionsForRole(role: RoleKey): Set<Permission> {
  const set = new Set<Permission>();
  (ROLE_VIEW_MODULES[role] ?? []).forEach((m) => set.add(perm(m, 'view')));
  // Admin tiers additionally get every action everywhere.
  if (role === 'PLATFORM_SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'OPERATIONS_MANAGER') {
    MODULES.forEach((m) => ACTIONS.forEach((a) => set.add(perm(m, a))));
  }
  return set;
}

/** Permission check against a loaded grant set. */
export function can(grants: Set<Permission> | Permission[], module: ModuleId, action: PermissionAction = 'view'): boolean {
  const p = perm(module, action);
  return Array.isArray(grants) ? grants.includes(p) : grants.has(p);
}

/** The router view ids a user may open, derived from their `view` grants. */
export function allowedViews(grants: Set<Permission> | Permission[]): string[] {
  const has = (p: Permission) => (Array.isArray(grants) ? grants.includes(p) : grants.has(p));
  const views = new Set<string>();
  for (const m of MODULES) {
    if (has(perm(m, 'view'))) views.add(MODULE_META[m].view);
  }
  return [...views];
}

export interface NavGroup {
  title: string;
  items: { view: string; label: string; module: ModuleId }[];
}

/** Build grouped, permission-filtered navigation from a grant set. */
export function navFromPermissions(grants: Set<Permission> | Permission[]): NavGroup[] {
  const has = (p: Permission) => (Array.isArray(grants) ? grants.includes(p) : grants.has(p));
  const order: NavGroup['title'][] = ['Operations', 'Commercial', 'Marine Operations', 'Documents & Partners', 'Reports & Analytics', 'Administration'];
  const groups: NavGroup[] = order.map((title) => ({ title, items: [] }));
  const byTitle = new Map(groups.map((g) => [g.title, g]));
  const seenViews = new Set<string>();

  for (const m of MODULES) {
    const meta = MODULE_META[m];
    if (meta.group === 'Top' || meta.group === 'Account') continue;
    if (!has(perm(m, 'view'))) continue;
    if (seenViews.has(meta.view)) continue; // e.g. users + roles both open 'admin'
    seenViews.add(meta.view);
    byTitle.get(meta.group)?.items.push({ view: meta.view, label: meta.label, module: m });
  }
  return groups.filter((g) => g.items.length > 0);
}
