import React, { useMemo, useState } from 'react';
import { CreditCard, TrendingUp, Users, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Organization, User } from '@/types';
import { PLAN_LIST, PLAN_STATUSES, PLANS, PlanId, resolvePlan, modulesForPlan, billableMonthly, money, trialEndFromNow, daysLeft } from '@/lib/billing/plans';

interface PlatformSubscriptionsViewProps {
  organizations: Organization[];
  users: User[];
  onUpdateOrganization: (id: string, updates: { plan?: string; planStatus?: string; planExpiry?: string | null; enabledModules?: string[] | null }) => Promise<Organization>;
}

const STATUS_STYLE: Record<string, string> = {
  trial: 'bg-sky-50 text-sky-700 border-sky-100',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  past_due: 'bg-rose-50 text-rose-700 border-rose-100',
  suspended: 'bg-amber-50 text-amber-700 border-amber-100',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function PlatformSubscriptionsView({ organizations, users, onUpdateOrganization }: PlatformSubscriptionsViewProps) {
  const customers = useMemo(() => organizations.filter((o) => !o.isPlatform), [organizations]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const userCount = useMemo(() => {
    const c: Record<string, number> = {};
    users.forEach((u) => { if (!u.platformRole) c[u.organizationId] = (c[u.organizationId] || 0) + 1; });
    return c;
  }, [users]);

  const summary = useMemo(() => {
    let mrr = 0, trials = 0;
    for (const o of customers) {
      const plan = resolvePlan(o.plan);
      mrr += billableMonthly(plan, o.planStatus);
      if ((o.planStatus || '').toLowerCase() === 'trial') trials += 1;
    }
    return { mrr, arr: mrr * 12, trials, customers: customers.length };
  }, [customers]);

  const changePlan = async (org: Organization, planId: PlanId) => {
    setMsg(null);
    try {
      await onUpdateOrganization(org.id, { plan: PLANS[planId].name, enabledModules: modulesForPlan(planId) });
      setMsg({ ok: true, text: `${org.companyName} moved to ${PLANS[planId].name}.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not update plan.' });
    }
  };

  const changeStatus = async (org: Organization, status: string) => {
    setMsg(null);
    try {
      // Moving to trial (re)starts the 14-day clock; leaving trial clears it.
      const planExpiry = status === 'trial' ? trialEndFromNow() : null;
      await onUpdateOrganization(org.id, { planStatus: status, planExpiry });
      setMsg({ ok: true, text: `${org.companyName} is now ${status}.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not update status.' });
    }
  };

  const cards = [
    { label: 'MRR', value: money(summary.mrr), hint: 'Monthly recurring revenue', icon: TrendingUp },
    { label: 'ARR', value: money(summary.arr), hint: 'Annualised', icon: CreditCard },
    { label: 'Customers', value: String(summary.customers), hint: 'Paying + trial tenants', icon: Building2 },
    { label: 'Trials', value: String(summary.trials), hint: 'Not yet billing', icon: Users },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Subscriptions</h2>
        <p className="text-xs text-slate-500 mt-0.5">Assign plans to customer organizations. Plan controls unlocked modules and seats; revenue is computed from active plans.</p>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => { const Icon = c.icon; return (
          <div key={c.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</span>
              <span className="h-8 w-8 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center"><Icon className="h-4 w-4" /></span>
            </div>
            <span className="text-2xl font-bold text-slate-900 tabular-nums mt-2 block">{c.value}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">{c.hint}</span>
          </div>
        ); })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Customer Plans</h4>
        </div>
        {customers.length === 0 ? (
          <EmptyState icon={Building2} title="No customers yet." description="Create an organization, then assign it a plan here." size="sm" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 bg-slate-50/40">
                  <th className="py-2.5 px-4">Organization</th><th className="py-2.5 px-3">Plan</th><th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Seats</th><th className="py-2.5 px-3 text-right">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((org) => {
                  const plan = resolvePlan(org.plan);
                  const seats = userCount[org.id] || 0;
                  const cap = plan.maxUsers;
                  const overCap = cap != null && seats > cap;
                  return (
                    <tr key={org.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <span className="text-xs font-bold text-slate-800 block">{org.companyName}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">{org.slug || org.id}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <select value={plan.id} onChange={(e) => changePlan(org, e.target.value as PlanId)} className="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] cursor-pointer">
                          {PLAN_LIST.map((p) => <option key={p.id} value={p.id}>{p.name}{p.priceMonthly ? ` — ${money(p.priceMonthly)}/mo` : ''}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <select value={(org.planStatus || 'active')} onChange={(e) => changeStatus(org, e.target.value)} className={`border rounded-lg px-2 py-1 text-[10px] font-bold uppercase cursor-pointer focus:outline-none ${STATUS_STYLE[(org.planStatus || 'active').toLowerCase()] || STATUS_STYLE.active}`}>
                          {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        {org.planStatus === 'trial' && (() => {
                          const left = daysLeft(org.planExpiry);
                          if (left === null) return null;
                          return <span className={`block mt-1 text-[10px] font-semibold ${left <= 0 ? 'text-rose-600' : left <= 3 ? 'text-amber-600' : 'text-slate-400'}`}>{left <= 0 ? 'Expired · workspace locked' : `${left}d left`}</span>;
                        })()}
                      </td>
                      <td className={`py-2.5 px-3 text-xs tabular-nums ${overCap ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {seats}{cap != null ? ` / ${cap}` : ' / ∞'}{overCap ? ' ⚠' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-bold text-slate-800 tabular-nums">{money(billableMonthly(plan, org.planStatus))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
