import React, { useState } from 'react';
import { Shield, Users, Activity, UserCheck, Key, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User, AuditLog, UserRole } from '@/types';
import { AdminApi } from '@/lib/supabase/adminApi';

interface AdminViewProps {
  users: User[];
  auditLogs: AuditLog[];
  onUpdateUserRole: (userId: string, role: string) => void;
  initialTab?: 'users' | 'auditlogs';
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

const INVITE_ROLES: { key: string; label: string }[] = [
  { key: 'ORG_ADMIN', label: 'Organization Admin' },
  { key: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
  { key: 'PORT_AGENT', label: 'Port Agent' },
  { key: 'SHIP_AGENT', label: 'Ship Agent' },
  { key: 'PROTECTIVE_AGENT', label: 'Protective Agent' },
  { key: 'FINANCE', label: 'Finance Officer' },
  { key: 'DOCUMENTATION', label: 'Documentation Officer' },
  { key: 'VIEWER', label: 'Viewer (read-only)' },
];

export default function AdminView({ users, auditLogs, onUpdateUserRole, initialTab = 'users' }: AdminViewProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [invite, setInvite] = useState({ email: '', name: '', roleKey: 'PORT_AGENT' });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg(null);
    setInviteBusy(true);
    try {
      await AdminApi.inviteUser({ email: invite.email.trim(), name: invite.name.trim(), roleKey: invite.roleKey });
      setInviteMsg({ ok: true, text: `Invitation sent to ${invite.email}. They'll get an email to set their password.` });
      setInvite({ email: '', name: '', roleKey: 'PORT_AGENT' });
    } catch (err) {
      setInviteMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to send invitation.' });
    } finally {
      setInviteBusy(false);
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
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">User Directory & Roles</h3>
            </div>
            <button
              onClick={() => { setShowAddUserModal(true); setInviteMsg(null); }}
              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" /> Invite User
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Operator Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Active Authorization</th>
                <th className="py-2.5 px-4 text-right">Modify Role Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center tabular-nums shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-500">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tabular-nums uppercase ${
                      u.role === 'ADMIN' ? 'bg-slate-100 text-slate-800 border' :
                      u.role === 'PORT_AGENT' ? 'bg-[#6C4CE1]/10 text-[#2D1B69]' :
                      u.role === 'SHIP_AGENT' ? 'bg-[#6C4CE1]/10 text-[#2D1B69]' :
                      'bg-purple-50 text-purple-800'
                    }`}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateUserRole(u.id, e.target.value)}
                      className="border border-slate-200 rounded p-1 text-[10px] font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
                    >
                      {DIRECTORY_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <Mail className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <span>Invite a User</span>
              </h4>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={submitInvite} className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Send an email invitation. The person sets their own password on the link — no public sign-up, and they join your organization with the role you choose.
              </p>

              {inviteMsg && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${inviteMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  {inviteMsg.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>{inviteMsg.text}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Full name</label>
                <input
                  type="text"
                  value={invite.name}
                  onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. David Miller"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Email address</label>
                <input
                  type="email"
                  required
                  value={invite.email}
                  onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
                  placeholder="colleague@company.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Role</label>
                <select
                  value={invite.roleKey}
                  onChange={(e) => setInvite((v) => ({ ...v, roleKey: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer"
                >
                  {INVITE_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">
                  Close
                </button>
                <button type="submit" disabled={inviteBusy} className={`px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 ${inviteBusy ? 'opacity-70' : ''}`}>
                  <Mail className="h-3.5 w-3.5" /> {inviteBusy ? 'Sending…' : 'Send invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
