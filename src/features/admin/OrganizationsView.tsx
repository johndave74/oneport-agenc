import React, { useMemo, useState } from 'react';
import { Building2, Plus, Mail, AlertTriangle, CheckCircle2, Users, X, Pencil, Trash2, Power, PauseCircle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Organization, User } from '@/types';
import { AdminApi } from '@/lib/supabase/adminApi';
import { PLAN_LIST, PLANS, PlanId, resolvePlan, modulesForPlan, money, trialEndFromNow, daysLeft } from '@/lib/billing/plans';

interface OrganizationsViewProps {
  organizations: Organization[];
  users: User[];
  currentOrgId?: string;
  onCreateOrganization: (input: { companyName: string; address?: string; licenseId?: string; plan?: string; planStatus?: string; planExpiry?: string | null; enabledModules?: string[] | null }) => Promise<Organization>;
  onUpdateOrganization: (id: string, updates: { companyName?: string; address?: string; licenseId?: string; status?: string; plan?: string; planStatus?: string; planExpiry?: string | null; enabledModules?: string[] | null }) => Promise<Organization>;
  onDeleteOrganization: (id: string) => Promise<void>;
}

export default function OrganizationsView({ organizations, users, currentOrgId, onCreateOrganization, onUpdateOrganization, onDeleteOrganization }: OrganizationsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState<{ companyName: string; address: string; licenseId: string; plan: PlanId; planStatus: string }>({ companyName: '', address: '', licenseId: '', plan: 'PROFESSIONAL', planStatus: 'trial' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [inviteFor, setInviteFor] = useState<Organization | null>(null);
  const [invite, setInvite] = useState({ email: '', name: '', password: '' });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const memberCount = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => { counts[u.organizationId] = (counts[u.organizationId] || 0) + 1; });
    return counts;
  }, [users]);

  // OnePort Agency (the platform company) is not a customer — never list it here.
  const customerOrgs = useMemo(() => organizations.filter((o) => !o.isPlatform), [organizations]);

  const openCreate = () => { setEditing(null); setForm({ companyName: '', address: '', licenseId: '', plan: 'PROFESSIONAL', planStatus: 'trial' }); setShowForm(true); setMsg(null); };
  const openEdit = (org: Organization) => { setEditing(org); setForm({ companyName: org.companyName, address: org.address || '', licenseId: org.licenseId || '', plan: resolvePlan(org.plan).id, planStatus: org.planStatus || 'active' }); setShowForm(true); setMsg(null); };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setBusy(true);
    setMsg(null);
    const planFields = {
      plan: PLANS[form.plan].name,
      planStatus: form.planStatus,
      enabledModules: modulesForPlan(form.plan),
      // Start (or restart) the 14-day clock for trials; clear it for paid.
      planExpiry: form.planStatus === 'trial' ? (editing?.planStatus === 'trial' && editing.planExpiry ? editing.planExpiry : trialEndFromNow()) : null,
    };
    try {
      if (editing) {
        await onUpdateOrganization(editing.id, { companyName: form.companyName.trim(), address: form.address.trim(), licenseId: form.licenseId.trim(), ...planFields });
        setMsg({ ok: true, text: 'Organization updated.' });
      } else {
        await onCreateOrganization({ companyName: form.companyName.trim(), address: form.address.trim(), licenseId: form.licenseId.trim(), ...planFields });
        setMsg({ ok: true, text: 'Organization created.' });
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save organization.' });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setMsg(null);
    try {
      await onDeleteOrganization(deleting.id);
      setMsg({ ok: true, text: `Deleted ${deleting.companyName}.` });
      setDeleting(null);
    } catch {
      setMsg({ ok: false, text: `Couldn't delete ${deleting.companyName} — it still has members or data. Remove those first.` });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFor) return;
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      await AdminApi.createUser({ email: invite.email.trim(), name: invite.name.trim(), password: invite.password, roleKey: 'ORG_ADMIN', organizationId: inviteFor.id });
      setInviteMsg({ ok: true, text: `Admin created for ${inviteFor.companyName}. They can sign in with the email and password you set.` });
      setInvite({ email: '', name: '', password: '' });
    } catch (err) {
      setInviteMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not create admin.' });
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Organizations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Create and manage the companies (tenants) on the platform. Each keeps its own isolated data.</p>
        </div>
        <button onClick={openCreate} className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer self-start">
          <Plus className="h-3.5 w-3.5" /> New Organization
        </button>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {customerOrgs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <EmptyState icon={Building2} title="No organizations yet." description="Create your first organization to onboard a company onto the platform." action={{ label: 'New Organization', onClick: openCreate }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customerOrgs.map((org) => (
            <div key={org.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{org.companyName}</h3>
                    <span className="text-[10px] text-slate-400 tabular-nums">{org.slug || org.id}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${org.status === 'suspended' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                  {org.status || 'active'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                {(() => {
                  const left = org.planStatus === 'trial' ? daysLeft(org.planExpiry) : null;
                  const expired = left !== null && left <= 0;
                  return (
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${expired ? 'bg-rose-50 text-rose-700' : 'bg-[#6C4CE1]/10 text-[#6C4CE1]'}`}>
                      {resolvePlan(org.plan).name}
                      {org.planStatus === 'trial' && (expired ? ' · Trial expired' : left !== null ? ` · Trial ${left}d left` : ' · Trial')}
                    </span>
                  );
                })()}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-400" />{memberCount[org.id] || 0} member{(memberCount[org.id] || 0) === 1 ? '' : 's'}</span>
                {org.licenseId && <span className="truncate">Lic: {org.licenseId}</span>}
              </div>
              {org.address && <p className="text-[11px] text-slate-400 leading-snug">{org.address}</p>}

              <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button onClick={() => { setInviteFor(org); setInvite({ email: '', name: '', password: '' }); setInviteMsg(null); }} className="text-[11px] font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-1 cursor-pointer">
                  <Mail className="h-3.5 w-3.5" /> Add an admin
                </button>
                <div className="flex items-center gap-1">
                  {org.status === 'suspended' ? (
                    <button onClick={() => onUpdateOrganization(org.id, { status: 'active' })} title="Activate" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => onUpdateOrganization(org.id, { status: 'suspended' })} title="Suspend" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
                      <PauseCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => openEdit(org)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-[#6C4CE1] hover:bg-[#6C4CE1]/10 transition-colors cursor-pointer">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {(() => {
                    const isOwn = org.id === currentOrgId;
                    const hasMembers = (memberCount[org.id] || 0) > 0;
                    const disabled = isOwn || hasMembers;
                    return (
                      <button
                        onClick={() => !disabled && setDeleting(org)}
                        disabled={disabled}
                        title={isOwn ? 'You cannot delete your own organization' : hasMembers ? 'Remove all members before deleting' : 'Delete'}
                        className={`p-1.5 rounded-lg transition-colors ${disabled ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Building2 className="h-4.5 w-4.5 text-[#6C4CE1]" /> {editing ? 'Edit Organization' : 'New Organization'}</h4>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={submitForm} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Company name *</label>
                <input required value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} placeholder="e.g. Blue Horizon Shipping Ltd" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Address</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">License / Registration ID</label>
                <input value={form.licenseId} onChange={(e) => setForm((f) => ({ ...f, licenseId: e.target.value }))} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Subscription plan</label>
                  <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as PlanId }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                    {PLAN_LIST.map((p) => <option key={p.id} value={p.id}>{p.name}{p.priceMonthly ? ` — ${money(p.priceMonthly)}/mo` : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Status</label>
                  <select value={form.planStatus} onChange={(e) => setForm((f) => ({ ...f, planStatus: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{PLANS[form.plan].blurb} {PLANS[form.plan].maxUsers ? `Up to ${PLANS[form.plan].maxUsers} users.` : 'Unlimited users.'}</p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={busy} className={`px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 ${busy ? 'opacity-70' : ''}`}>
                  {editing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {busy ? 'Saving…' : editing ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Trash2 className="h-5 w-5" /></div>
              <h4 className="text-sm font-bold text-slate-800">Delete {deleting.companyName}?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">This permanently removes the organization. This can't be undone.</p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={confirmDelete} disabled={deleteBusy} className={`px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 ${deleteBusy ? 'opacity-70' : ''}`}>
                  <Trash2 className="h-3.5 w-3.5" /> {deleteBusy ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite admin modal */}
      {inviteFor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Mail className="h-4.5 w-4.5 text-[#6C4CE1]" /> Add Admin — {inviteFor.companyName}</h4>
              <button onClick={() => setInviteFor(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={submitInvite} className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">Set an email and password. They sign in with those and join <strong>{inviteFor.companyName}</strong> as its Organization Admin. No email is sent.</p>
              {inviteMsg && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${inviteMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  {inviteMsg.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>{inviteMsg.text}</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Full name</label>
                <input value={invite.name} onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. Grace Okoro" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Email address</label>
                <input type="email" required value={invite.email} onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))} placeholder="admin@company.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Password</label>
                <input type="text" required value={invite.password} onChange={(e) => setInvite((v) => ({ ...v, password: e.target.value }))} placeholder="At least 8 characters" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setInviteFor(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Close</button>
                <button type="submit" disabled={inviteBusy} className={`px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 ${inviteBusy ? 'opacity-70' : ''}`}>
                  <Mail className="h-3.5 w-3.5" /> {inviteBusy ? 'Creating…' : 'Create admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
