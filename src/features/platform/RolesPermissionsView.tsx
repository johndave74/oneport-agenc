import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { RoleKey } from '@/types';
import { MODULES, MODULE_META, defaultPermissionsForRole, can } from '@/lib/rbac/permissions';

const ROLES: { key: RoleKey; label: string }[] = [
  { key: 'PLATFORM_SUPER_ADMIN', label: 'Platform Admin' },
  { key: 'ORG_ADMIN', label: 'Org Admin' },
  { key: 'OPERATIONS_MANAGER', label: 'Ops Manager' },
  { key: 'PORT_AGENT', label: 'Port Agent' },
  { key: 'SHIP_AGENT', label: 'Ship Agent' },
  { key: 'PROTECTIVE_AGENT', label: 'Protective' },
  { key: 'FINANCE', label: 'Finance' },
  { key: 'DOCUMENTATION', label: 'Docs Officer' },
  { key: 'VIEWER', label: 'Viewer' },
];

export default function RolesPermissionsView() {
  const grants = ROLES.map((r) => ({ ...r, perms: defaultPermissionsForRole(r.key) }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Roles &amp; Permissions</h2>
        <p className="text-xs text-slate-500 mt-0.5">System roles and the modules each one can access. This matrix is read-only for now — editable custom roles come in a later phase.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="py-3 px-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider sticky left-0 bg-slate-50/60">Module</th>
                {grants.map((r) => (
                  <th key={r.key} className="py-3 px-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-center whitespace-nowrap">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULES.map((m) => (
                <tr key={m} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 text-xs font-semibold text-slate-700 sticky left-0 bg-white">{MODULE_META[m].label}</td>
                  {grants.map((r) => (
                    <td key={r.key} className="py-2.5 px-2 text-center">
                      {can(r.perms, m, 'view') ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-slate-200">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-[#6C4CE1]" />
        <span>A ✓ means the role can open that module. Admin-tier roles (Platform Admin, Org Admin, Ops Manager) additionally have create / edit / delete / approve rights across modules. The authoritative grants live in the database (<code>role_permissions</code>).</span>
      </div>
    </div>
  );
}
