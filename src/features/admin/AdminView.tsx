import React, { useState } from 'react';
import { Activity, Users, UserCheck, Key, UserPlus, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { User, AuditLog, Organization } from '@/types';
import { AdminApi } from '@/lib/supabase/adminApi';

interface AdminViewProps {
  users: User[];
  auditLogs: AuditLog[];
  onUpdateUserRole: (userId: string, role: string) => void | Promise<void>;
  initialTab?: 'users' | 'auditlogs';
  organizations?: Organization[];
  allowOrgSelect?: boolean;
  onUserCreated?: () => void;
  roleFilter?: string;
  title?: string;
  currentUserId?: string;
}

const DIRECTORY_ROLES: { key: string; label: string }[] = [
  { key: 'PLATFORM_SUPER_ADMIN', label: 'Platform Super Admin' },
  { key: 'ORG_ADMIN', label: 'Organization Admin' },
  { key: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
  { key: 'PORT_AGENT', label: 'Port Agent' },
  { key: 'SHIP_AGENT', label: 'Ship Agent' },
  { key: 'PROTECTIVE_AGENT', label: 'Protective Agent' },
  { key: 'FINANCE', label: 'Finance Officer' },
  { key: 'DOCUMENTATION', label: 'Documentation Officer' },
  { key: 'VIEWER', label: 'Viewer' },
];

// Roles an admin can assign when creating a user (excludes Platform Super Admin).
const CREATE_ROLES = DIRECTORY_ROLES.filter((r) => r.key !== 'PLATFORM_SUPER_ADMIN');

export default function AdminView({ users, auditLogs, onUpdateUserRole, initialTab = 'users', organizations = [], allowOrgSelect = false, onUserCreated, roleFilter, title, currentUserId }: AdminViewProps) {
  const shownUsers = roleFilter ? users.filter((u) => (u.role as string) === roleFilter) : users;
  const orgName = (id: string) => organizations.find((o) => o.id === id)?.companyName || id;
  const showOrgColumn = organizations.length > 0;
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleKey: 'PORT_AGENT', organizationId: '' });
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Count Org Admins per organization to protect the last one.
  const orgAdminCounts = users.reduce<Record<string, number>>((acc, u) => {
    if ((u.role as string) === 'ORG_ADMIN') acc[u.organizationId] = (acc[u.organizationId] || 0) + 1;
    return acc;
  }, {});

  const changeRole = async (u: User, role: string) => {
    setRoleError(null);
    try {
      await onUpdateUserRole(u.id, role);
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Could not change role.');
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    setBusy(true);
    try {
      await AdminApi.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        roleKey: form.roleKey,
        organizationId: allowOrgSelect ? (form.organizationId || undefined) : undefined,
      });
      setFormMsg({ ok: true, text: `User ${form.email} created. They can sign in with the email and password you set.` });
      setForm({ name: '', email: '', password: '', roleKey: 'PORT_AGENT', organizationId: '' });
      onUserCreated?.();
    } catch (err) {
      setFormMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to create user.' });
    } finally {
      setBusy(false);
    }
  };

  if (initialTab === 'auditlogs') {
    return (
      <div className="text-xs">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2">
            <Activity className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security Audit Trails</h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto p-2">
            {auditLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No audit log entries recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50/50 rounded-lg space-y-1.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 block">{log.action}</span>
                    <span className="text-[9px] text-slate-400 tabular-nums">{log.timestamp.replace('T', ' ')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    "{log.details}"
                  </p>
                  <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 tabular-nums font-medium">
                    <UserCheck className="h-3 w-3 text-slate-300" />
                    <span>Operator: {log.userName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">

      {/* Col 1 & 2: User Role Permissions Management */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* User management list */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4.5 w-4.5 text-[#6C4CE1]" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title || 'User Directory & Roles'}</h3>
              <span className="text-[10px] font-bold text-slate-400 tabular-nums">({shownUsers.length})</span>
            </div>
            <button
              onClick={() => { setShowAddUserModal(true); setFormMsg(null); }}
              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" /> Create User
            </button>
          </div>

          {roleError && (
            <div className="mx-4 mt-3 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{roleError}</span>
            </div>
          )}
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                {showOrgColumn && <th className="py-2.5 px-4">Organization</th>}
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shownUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center tabular-nums shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-500">{u.email}</td>
                  {showOrgColumn && <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">{orgName(u.organizationId)}</td>}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6C4CE1]/10 text-[#2D1B69]">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(() => {
                      const isSelf = !!currentUserId && u.id === currentUserId;
                      const isLastAdmin = (u.role as string) === 'ORG_ADMIN' && (orgAdminCounts[u.organizationId] || 0) <= 1;
                      const locked = isSelf || isLastAdmin;
                      if (locked) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400" title={isSelf ? 'You cannot change your own role.' : 'Last Organization Admin — promote another admin first.'}>
                            <Lock className="h-3 w-3" /> {DIRECTORY_ROLES.find((r) => r.key === u.role)?.label || u.role}
                          </span>
                        );
                      }
                      return (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="border border-slate-200 rounded p-1 text-[10px] font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
                        >
                          {DIRECTORY_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {shownUsers.length === 0 && (
                <tr><td colSpan={showOrgColumn ? 5 : 4} className="py-8 text-center text-slate-400 text-xs">No users to show.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Permissions guidelines */}
        <div className="bg-white border border-slate-200 text-slate-700 p-5 rounded-xl space-y-4 shadow-sm">
          <h4 className="font-bold text-[#6C4CE1] uppercase tracking-wider text-[10px] tabular-nums flex items-center space-x-2">
            <Key className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <span>Role-Based Access Control (RBAC) Matrices</span>
          </h4>
          <div className="grid grid-cols-3 gap-4 text-[11px] leading-relaxed text-slate-600">
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Port Agents</span>
              <p className="text-slate-500">Can create vessels, modify pilot & tug tasks, record expenses under PDA.</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Ship Agents</span>
              <p className="text-slate-500">Can edit cargo details, track turnaround times, coordinate crew accommodation & checklists.</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Protective Agents</span>
              <p className="text-slate-500">Can audit PDA cost overruns, flag suspicious expenses, approve/reject cost items.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Col 3: Realtime Database Audit Trail Logs */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2">
            <Activity className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security Audit Trails</h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto p-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-50/50 rounded-lg space-y-1.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block">{log.action}</span>
                  <span className="text-[9px] text-slate-400 tabular-nums">{log.timestamp.replace('T', ' ')}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  "{log.details}"
                </p>
                <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 tabular-nums font-medium">
                  <UserCheck className="h-3 w-3 text-slate-300" />
                  <span>Operator: {log.userName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <UserPlus className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <span>Create a User</span>
              </h4>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={submitCreate} className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Set the person's email and a password. They sign in with those straight away — no email is sent. Share the credentials with them securely.
              </p>

              {formMsg && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${formMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  {formMsg.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>{formMsg.text}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Full name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. David Miller" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Email address</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="colleague@company.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 flex items-center gap-1.5"><Lock className="h-3 w-3 text-slate-400" /> Password</label>
                <input type="text" required value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="At least 8 characters" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>

              {allowOrgSelect && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Organization</label>
                  <select value={form.organizationId} onChange={(e) => setForm((v) => ({ ...v, organizationId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                    <option value="">— Select organization —</option>
                    {organizations.map((o) => <option key={o.id} value={o.id}>{o.companyName}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Role</label>
                <select value={form.roleKey} onChange={(e) => setForm((v) => ({ ...v, roleKey: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                  {CREATE_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Close</button>
                <button type="submit" disabled={busy} className={`px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 ${busy ? 'opacity-70' : ''}`}>
                  <UserPlus className="h-3.5 w-3.5" /> {busy ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
