import React from 'react';
import { CreditCard, CheckCircle2, Users, HardDrive, CalendarClock, Lock, Boxes, Clock } from 'lucide-react';
import { Organization } from '@/types';
import { MODULE_META, MODULES, ModuleId } from '@/lib/rbac/permissions';
import { daysLeft } from '@/lib/billing/plans';

interface SubscriptionViewProps {
  org: Organization;
  userCount: number;
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  trial: 'bg-sky-50 text-sky-700 border-sky-100',
  past_due: 'bg-rose-50 text-rose-700 border-rose-100',
  suspended: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function SubscriptionView({ org, userCount }: SubscriptionViewProps) {
  const enabled = org.enabledModules && org.enabledModules.length > 0 ? org.enabledModules : null; // null = all
  const enabledList: ModuleId[] = (enabled ? MODULES.filter((m) => enabled.includes(m)) : MODULES);
  const status = (org.planStatus || 'active').toLowerCase();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Subscription</h2>
        <p className="text-xs text-slate-500 mt-0.5">Your plan and usage for <strong>{org.companyName}</strong>. Plans are managed by OnePort Agency.</p>
      </div>

      {status === 'trial' && (() => {
        const left = daysLeft(org.planExpiry);
        if (left === null) return null;
        const warn = left <= 3;
        return (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs border ${warn ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-sky-50 border-sky-200 text-sky-800'}`}>
            <Clock className="h-4 w-4 shrink-0" />
            <span><strong>Free trial:</strong> {left > 0 ? `${left} day${left === 1 ? '' : 's'} remaining.` : 'ended.'} Contact OnePort Agency to choose a paid plan and keep your workspace active.</span>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plan */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2"><CreditCard className="h-4.5 w-4.5 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Current Plan</h4></div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[status] || STATUS_STYLE.active}`}>{status.replace('_', ' ')}</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Plan</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{org.plan || 'Professional'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Renews / Expires</span>
              <span className="text-sm font-bold text-slate-700 mt-1.5 block tabular-nums">{org.planExpiry ? org.planExpiry.slice(0, 10) : 'No expiry'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Users className="h-3 w-3" /> Users</span>
              <span className="text-sm font-bold text-slate-700 mt-1.5 block tabular-nums">{userCount} active</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-[#6C4CE1]" />
              <span>Your plan is managed by OnePort Agency. To upgrade, change modules, or adjust seats, contact your account manager — you can't self-manage billing here.</span>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Usage</h4></div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600"><Users className="h-3.5 w-3.5 text-slate-400" /> Users</span>
            <span className="font-bold text-slate-800 tabular-nums">{userCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600"><HardDrive className="h-3.5 w-3.5 text-slate-400" /> Storage</span>
            <span className="font-semibold text-slate-500 text-xs">Managed by Supabase</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">Seat limits and storage caps are enforced per plan once configured platform-side.</p>
        </div>
      </div>

      {/* Enabled modules */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enabled Modules</h4></div>
          {!enabled && <span className="text-[10px] font-semibold text-emerald-600">All modules included</span>}
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {enabledList.filter((m) => m !== 'dashboard' && m !== 'settings' && m !== 'notifications').map((m) => (
            <div key={m} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{MODULE_META[m].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
