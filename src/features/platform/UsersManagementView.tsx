import React, { useMemo, useState } from 'react';
import {
  Users, UserCog, UserPlus, Search, KeyRound, Trash2, Power, PauseCircle,
  X, AlertTriangle, CheckCircle2, Building2, ShieldCheck, Crown, Lock,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { User, Organization, AuditLog } from '@/types';
import { AdminApi } from '@/lib/supabase/adminApi';

type Scope = 'platform' | 'organization';

interface UsersManagementViewProps {
  scope: Scope;
  users: User[];
  organizations: Organization[];
  auditLogs: AuditLog[];
  currentUserId?: string;
  currentUserIsOwner?: boolean;
  onUpdateUserRole: (userId: string, role: string) => void;
  onUpdateAccountStatus: (userId: string, status: string) => Promise<void>;
  onRefresh: () => void;
}

const PLATFORM_ROLES = [
  { key: 'PLATFORM_OWNER', label: 'Platform Owner' },
  { key: 'PLATFORM_STAFF', label: 'Platform Staff' },
];

const ORG_ROLES = [
  { key: 'ORG_ADMIN', label: 'Organization Admin' },
  { key: 'SHIP_AGENT', label: 'Ship Agent' },
  { key: 'PORT_AGENT', label: 'Port Agent' },
  { key: 'PROTECTIVE_AGENT', label: 'Protective Agent' },
  { key: 'SUPERVISORY_AGENT', label: 'Supervisory Agent' },
  { key: 'FINANCE', label: 'Finance Officer' },
  { key: 'OPERATIONS_MANAGER', label: 'Operations Officer' },
  { key: 'VIEWER', label: 'Read Only' },
];

function label(key: string): string {
  return [...PLATFORM_ROLES, ...ORG_ROLES].find((r) => r.key === key)?.label || key.replace(/_/g, ' ');
}

export default function UsersManagementView({ scope, users, organizations, auditLogs, currentUserId, currentUserIsOwner = false, onUpdateUserRole, onUpdateAccountStatus, onRefresh }: UsersManagementViewProps) {
  const isPlatform = scope === 'platform';
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [deleteFor, setDeleteFor] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferAck, setTransferAck] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);

  const staffMembers = useMemo(() => users.filter((u) => u.platformRole === 'PLATFORM_STAFF'), [users]);

  const doTransfer = async () => {
    if (!transferTo || !transferAck) return;
    setTransferBusy(true);
    setMsg(null);
    try {
      await AdminApi.transferOwnership(transferTo);
      setMsg({ ok: true, text: 'Platform ownership transferred. You are now Platform Staff.' });
      setShowTransfer(false); setTransferTo(''); setTransferAck(false);
      onRefresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Transfer failed.' });
    } finally { setTransferBusy(false); }
  };

  const orgName = (id: string) => organizations.find((o) => o.id === id)?.companyName || id;

  const lastLogin = useMemo(() => {
    const map: Record<string, string> = {};
    for (const l of auditLogs) {
      if (!/auth|login|session/i.test(l.action)) continue;
      if (!map[l.userName] || (l.timestamp || '') > map[l.userName]) map[l.userName] = l.timestamp || '';
    }
    return map;
  }, [auditLogs]);

  const rows = useMemo(() => {
    const base = users.filter((u) => (isPlatform ? !!u.platformRole : !u.platformRole));
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (!isPlatform && orgName(u.organizationId).toLowerCase().includes(q))
    );
  }, [users, isPlatform, query]);

  const doReset = async () => {
    if (!resetFor) return;
    setBusyId(resetFor.id);
    setMsg(null);
    try {
      await AdminApi.resetPassword(resetFor.id, resetPw);
      setMsg({ ok: true, text: `Password reset for ${resetFor.email}.` });
      setResetFor(null); setResetPw('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Reset failed.' });
    } finally { setBusyId(null); }
  };

  const doDelete = async () => {
    if (!deleteFor) return;
    setBusyId(deleteFor.id);
    setMsg(null);
    try {
      await AdminApi.deleteUser(deleteFor.id);
      setMsg({ ok: true, text: `Deleted ${deleteFor.email}.` });
      setDeleteFor(null);
      onRefresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally { setBusyId(null); }
  };

  const toggleStatus = async (u: User) => {
    setBusyId(u.id);
    try { await onUpdateAccountStatus(u.id, u.accountStatus === 'suspended' ? 'active' : 'suspended'); }
    finally { setBusyId(null); }
  };

  const Icon = isPlatform ? UserCog : Users;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2"><Icon className="h-5 w-5 text-[#6C4CE1]" />{isPlatform ? 'Platform Team' : 'Organization Users'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{isPlatform ? 'Employees of the SaaS platform. Separate from customer organizations.' : 'Users belonging to customer organizations.'}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {isPlatform && currentUserIsOwner && (
            <button onClick={() => { setShowTransfer(true); setMsg(null); }} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
              <Crown className="h-3.5 w-3.5 text-amber-500" /> Transfer Ownership
            </button>
          )}
          <button onClick={() => { setShowCreate(true); setMsg(null); }} className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer">
            <UserPlus className="h-3.5 w-3.5" /> {isPlatform ? 'Add Platform User' : 'Create User'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…" className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
          </div>
          <span className="text-[11px] text-slate-400 tabular-nums ml-auto">{rows.length} user{rows.length === 1 ? '' : 's'}</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Icon} title={isPlatform ? 'No platform team members yet.' : 'No organization users yet.'} description={isPlatform ? 'Invite your first platform employee.' : 'Create users inside your customer organizations.'} action={{ label: isPlatform ? 'Invite Platform User' : 'Create User', onClick: () => setShowCreate(true) }} size="sm" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 bg-slate-50/40">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">{isPlatform ? 'Platform Role' : 'Organization'}</th>
                  <th className="py-2.5 px-3">{isPlatform ? 'Department' : 'Role'}</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => {
                  const suspended = u.accountStatus === 'suspended';
                  const self = u.id === currentUserId;
                  const isOwnerRow = u.platformRole === 'PLATFORM_OWNER';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#6C4CE1]/10 text-[#6C4CE1] font-bold text-[11px] flex items-center justify-center shrink-0">{u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{u.name}{self && <span className="text-[9px] font-semibold text-slate-400 ml-1">(you)</span>}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 truncate max-w-[180px]">{u.email}</td>
                      <td className="py-2.5 px-3">
                        {isPlatform ? (
                          isOwnerRow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Crown className="h-3 w-3" />Platform Owner</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#6C4CE1]/10 text-[#2D1B69]"><ShieldCheck className="h-3 w-3" />Platform Staff</span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-600 truncate max-w-[140px] inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-slate-300" />{orgName(u.organizationId)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isPlatform ? (
                          <span className="text-[11px] text-slate-500">{u.platformDepartment || '—'}</span>
                        ) : (
                          <select value={u.role} onChange={(e) => onUpdateUserRole(u.id, e.target.value)} className="border border-slate-200 rounded p-1 text-[10px] font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer">
                            {ORG_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${suspended ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{suspended ? 'Suspended' : 'Active'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 tabular-nums">{lastLogin[u.name] ? lastLogin[u.name].replace('T', ' ').slice(0, 16) : '—'}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {isOwnerRow ? (
                            <>
                              {/* Owner may reset only their own password; all other actions are hidden. */}
                              {self && (
                                <button onClick={() => { setResetFor(u); setResetPw(''); setMsg(null); }} title="Reset your password" className="p-1.5 rounded-lg text-slate-400 hover:text-[#6C4CE1] hover:bg-[#6C4CE1]/10 transition-colors cursor-pointer"><KeyRound className="h-3.5 w-3.5" /></button>
                              )}
                              <span title="Platform Owner is protected and cannot be modified. Ownership must be transferred first." className="p-1.5 text-amber-500"><Lock className="h-3.5 w-3.5" /></span>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setResetFor(u); setResetPw(''); setMsg(null); }} title="Reset password" className="p-1.5 rounded-lg text-slate-400 hover:text-[#6C4CE1] hover:bg-[#6C4CE1]/10 transition-colors cursor-pointer"><KeyRound className="h-3.5 w-3.5" /></button>
                              <button onClick={() => toggleStatus(u)} disabled={busyId === u.id || self} title={suspended ? 'Activate' : 'Suspend'} className={`p-1.5 rounded-lg transition-colors ${self ? 'text-slate-200 cursor-not-allowed' : suspended ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer'}`}>{suspended ? <Power className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}</button>
                              <button onClick={() => { setDeleteFor(u); setMsg(null); }} disabled={self} title={self ? "You can't delete yourself" : 'Delete'} className={`p-1.5 rounded-lg transition-colors ${self ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'}`}><Trash2 className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal scope={scope} organizations={organizations} onClose={() => setShowCreate(false)} onCreated={(text) => { setShowCreate(false); setMsg({ ok: true, text }); onRefresh(); }} />
      )}

      {/* Transfer ownership */}
      {showTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Crown className="h-4.5 w-4.5 text-amber-500" /> Transfer Platform Ownership</h4>
              <button onClick={() => setShowTransfer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>This makes another person the root Platform Owner and <strong>demotes you to Platform Staff</strong>. Only they will be able to transfer it back. This is logged.</span>
              </div>
              {staffMembers.length === 0 ? (
                <p className="text-slate-500">There are no Platform Staff members to transfer to. Create one first.</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">New owner (a Platform Staff member)</label>
                    <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                      <option value="">— Select a staff member —</option>
                      {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.email}</option>)}
                    </select>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={transferAck} onChange={(e) => setTransferAck(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-[#6C4CE1] focus:ring-[#6C4CE1]" />
                    <span className="text-slate-600">I understand this transfers full platform control and demotes my account to Platform Staff.</span>
                  </label>
                </>
              )}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => setShowTransfer(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={doTransfer} disabled={!transferTo || !transferAck || transferBusy} className={`px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 ${(!transferTo || !transferAck) ? 'opacity-60' : ''}`}><Crown className="h-3.5 w-3.5" /> {transferBusy ? 'Transferring…' : 'Transfer ownership'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset password */}
      {resetFor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><KeyRound className="h-4 w-4 text-[#6C4CE1]" /> Reset Password</h4>
              <button onClick={() => setResetFor(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-500">Set a new password for <strong>{resetFor.email}</strong>. Share it with them securely.</p>
              <input type="text" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="New password (8+ chars)" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setResetFor(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={doReset} disabled={resetPw.length < 8 || busyId === resetFor.id} className={`px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold shadow-sm ${resetPw.length < 8 ? 'opacity-60' : ''}`}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteFor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Trash2 className="h-5 w-5" /></div>
              <h4 className="text-sm font-bold text-slate-800">Delete {deleteFor.name}?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">This permanently removes <strong>{deleteFor.email}</strong> and their login. This can't be undone.</p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setDeleteFor(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={doDelete} disabled={busyId === deleteFor.id} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------- Create modal

function CreateUserModal({ scope, organizations, onClose, onCreated }: {
  scope: Scope;
  organizations: Organization[];
  onClose: () => void;
  onCreated: (text: string) => void;
}) {
  const [type, setType] = useState<Scope>(scope);
  const [form, setForm] = useState({ name: '', email: '', password: '', platformDepartment: '', organizationId: '', roleKey: 'PORT_AGENT' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (type === 'organization' && !form.organizationId) return setError('Select an organization.');
    setBusy(true);
    try {
      if (type === 'platform') {
        // Platform users are always created as Staff; the Owner is unique and set via transfer.
        await AdminApi.createUser({ name: form.name.trim(), email: form.email.trim(), password: form.password, roleKey: 'VIEWER', platformRole: 'PLATFORM_STAFF', platformDepartment: form.platformDepartment.trim() });
        onCreated(`Platform staff ${form.email} created.`);
      } else {
        await AdminApi.createUser({ name: form.name.trim(), email: form.email.trim(), password: form.password, roleKey: form.roleKey, organizationId: form.organizationId });
        onCreated(`User ${form.email} created.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><UserPlus className="h-4.5 w-4.5 text-[#6C4CE1]" /> Create a User</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4 text-xs">
          {/* Step 1 — type */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1.5">User type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['platform', 'organization'] as Scope[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${type === t ? 'border-[#6C4CE1] bg-[#6C4CE1]/5 text-[#2D1B69]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-xs font-bold block">{t === 'platform' ? 'Platform User' : 'Organization User'}</span>
                  <span className="text-[10px] text-slate-400">{t === 'platform' ? 'SaaS employee' : 'Customer company user'}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="flex items-start gap-2 rounded-lg px-3 py-2 border bg-rose-50 border-rose-200 text-rose-700"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span></div>}

          <div className="space-y-1"><label className="font-semibold text-slate-600">Full name</label><input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. David Miller" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" /></div>
          <div className="space-y-1"><label className="font-semibold text-slate-600">Email address</label><input type="email" required value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="person@company.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" /></div>
          <div className="space-y-1"><label className="font-semibold text-slate-600">Password</label><input type="text" required value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="At least 8 characters" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" /></div>

          {type === 'platform' ? (
            <>
              <div className="flex items-center gap-2 bg-[#6C4CE1]/5 border border-[#6C4CE1]/15 rounded-lg px-3 py-2 text-[11px] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6C4CE1] shrink-0" /> Created as <strong className="text-slate-800">Platform Staff</strong>. Only ownership transfer can make someone the Platform Owner.
              </div>
              <div className="space-y-1"><label className="font-semibold text-slate-600">Department</label><input value={form.platformDepartment} onChange={(e) => setForm((v) => ({ ...v, platformDepartment: e.target.value }))} placeholder="e.g. Engineering, Support" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" /></div>
            </>
          ) : (
            <>
              <div className="space-y-1"><label className="font-semibold text-slate-600">Organization</label>
                <select value={form.organizationId} onChange={(e) => setForm((v) => ({ ...v, organizationId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                  <option value="">— Select organization —</option>
                  {organizations.filter((o) => !o.isPlatform).map((o) => <option key={o.id} value={o.id}>{o.companyName}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="font-semibold text-slate-600">Role</label>
                <select value={form.roleKey} onChange={(e) => setForm((v) => ({ ...v, roleKey: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                  {ORG_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={busy} className={`px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 ${busy ? 'opacity-70' : ''}`}><UserPlus className="h-3.5 w-3.5" /> {busy ? 'Creating…' : 'Create user'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
