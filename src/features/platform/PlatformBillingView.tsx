import React, { useMemo } from 'react';
import { CreditCard, TrendingUp, Wallet, Sparkles, ArrowRight, Building2, Info } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Organization } from '@/types';
import { resolvePlan, billableMonthly, money, daysLeft } from '@/lib/billing/plans';

interface PlatformBillingViewProps {
  organizations: Organization[];
  setView: (view: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  trial: 'bg-sky-50 text-sky-700 border-sky-100',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  past_due: 'bg-rose-50 text-rose-700 border-rose-100',
  suspended: 'bg-amber-50 text-amber-700 border-amber-100',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function PlatformBillingView({ organizations, setView }: PlatformBillingViewProps) {
  const customers = useMemo(() => organizations.filter((o) => !o.isPlatform), [organizations]);

  const totals = useMemo(() => {
    let mrr = 0, pipeline = 0, paying = 0;
    for (const o of customers) {
      const plan = resolvePlan(o.plan);
      const billable = billableMonthly(plan, o.planStatus);
      mrr += billable;
      if (billable > 0) paying += 1;
      if ((o.planStatus || '').toLowerCase() === 'trial') pipeline += plan.priceMonthly; // potential if converted
    }
    return { mrr, arr: mrr * 12, pipeline, paying };
  }, [customers]);

  const cards = [
    { label: 'Monthly Recurring Revenue', value: money(totals.mrr), hint: 'From active paying plans', icon: TrendingUp },
    { label: 'Annual Run Rate', value: money(totals.arr), hint: 'MRR × 12', icon: CreditCard },
    { label: 'Paying Customers', value: String(totals.paying), hint: 'Billing this month', icon: Building2 },
    { label: 'Trial Pipeline', value: money(totals.pipeline), hint: 'Potential MRR if trials convert', icon: Sparkles },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Billing</h2>
        <p className="text-xs text-slate-500 mt-0.5">What each customer is billed based on their assigned plan.</p>
      </div>

      {/* Honest note about payment collection */}
      <div className="flex items-start gap-2 bg-[#6C4CE1]/5 border border-[#6C4CE1]/15 rounded-xl px-4 py-3 text-xs text-slate-600">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-[#6C4CE1]" />
        <span>This is your <strong>billing schedule</strong> computed from assigned plans. To collect card payments automatically and track paid vs outstanding invoices, connect <strong>Stripe</strong> — that's the next step. Until then, treat this as invoicing guidance and record payments in your accounting system.</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => { const Icon = c.icon; return (
          <div key={c.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{c.label}</span><span className="h-8 w-8 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></span></div>
            <span className="text-2xl font-bold text-slate-900 tabular-nums mt-2 block">{c.value}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">{c.hint}</span>
          </div>
        ); })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Billing Schedule</h4></div>
          <button onClick={() => setView('subscriptions')} className="text-[11px] font-semibold text-[#6C4CE1] flex items-center gap-1 cursor-pointer">Manage plans <ArrowRight className="h-3 w-3" /></button>
        </div>
        {customers.length === 0 ? (
          <EmptyState icon={Building2} title="No customers to bill yet." description="Create an organization and assign a plan to start billing." size="sm" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 bg-slate-50/40">
                  <th className="py-2.5 px-4">Organization</th><th className="py-2.5 px-3">Plan</th><th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Next renewal</th><th className="py-2.5 px-3 text-right">Monthly</th><th className="py-2.5 px-3 text-right">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((org) => {
                  const plan = resolvePlan(org.plan);
                  const billable = billableMonthly(plan, org.planStatus);
                  const status = (org.planStatus || 'active').toLowerCase();
                  const left = status === 'trial' ? daysLeft(org.planExpiry) : null;
                  return (
                    <tr key={org.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <span className="text-xs font-bold text-slate-800 block">{org.companyName}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">{org.slug || org.id}</span>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-semibold text-slate-700">{plan.name}</td>
                      <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_STYLE[status] || STATUS_STYLE.active}`}>{status.replace('_', ' ')}</span></td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 tabular-nums">
                        {org.planExpiry ? org.planExpiry.slice(0, 10) : '—'}
                        {left !== null && <span className={`ml-1 ${left <= 0 ? 'text-rose-600' : left <= 3 ? 'text-amber-600' : 'text-slate-400'}`}>({left <= 0 ? 'expired' : `${left}d`})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-bold text-slate-800 tabular-nums">{money(billable)}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-slate-500 tabular-nums">{money(billable * 12)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-100 bg-slate-50/40">
                  <td colSpan={4} className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</td>
                  <td className="py-2.5 px-3 text-right text-sm font-bold text-slate-900 tabular-nums">{money(totals.mrr)}</td>
                  <td className="py-2.5 px-3 text-right text-sm font-bold text-slate-900 tabular-nums">{money(totals.arr)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
