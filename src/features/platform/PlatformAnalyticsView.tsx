import React, { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts';
import { Building2, Users, Zap, TrendingUp, CreditCard, Activity, Trophy } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Organization, User, AuditLog } from '@/types';
import { resolvePlan, billableMonthly, money } from '@/lib/billing/plans';

interface PlatformAnalyticsViewProps {
  organizations: Organization[];
  users: User[];
  auditLogs: AuditLog[];
}

const COLORS = ['#6C4CE1', '#26a69a', '#00bcd4', '#f59e0b', '#e11d48', '#3f51b5'];
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Panel({ title, icon: Icon, children, action }: { title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4></div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function PlatformAnalyticsView({ organizations, users, auditLogs }: PlatformAnalyticsViewProps) {
  const customers = useMemo(() => organizations.filter((o) => !o.isPlatform), [organizations]);

  const summary = useMemo(() => {
    let mrr = 0, trials = 0;
    for (const o of customers) { mrr += billableMonthly(resolvePlan(o.plan), o.planStatus); if ((o.planStatus || '').toLowerCase() === 'trial') trials += 1; }
    const orgUsers = users.filter((u) => !u.platformRole).length;
    const today = dayKey(new Date());
    const activeToday = new Set(auditLogs.filter((l) => (l.timestamp || '').slice(0, 10) === today && /auth|login|session/i.test(l.action)).map((l) => l.userName)).size;
    return { customers: customers.length, mrr, arr: mrr * 12, trials, orgUsers, activeToday };
  }, [customers, users, auditLogs]);

  const orgGrowth = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, name: d.toLocaleDateString(undefined, { month: 'short' }), total: 0 }); }
    for (const b of buckets) b.total = customers.filter((o) => ((o.createdAt || '').slice(0, 7) || '9999-99') <= b.key).length;
    return buckets;
  }, [customers]);

  const planDist = useMemo(() => {
    const c: Record<string, number> = {};
    customers.forEach((o) => { const n = resolvePlan(o.plan).name; c[n] = (c[n] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [customers]);

  const mrrByPlan = useMemo(() => {
    const c: Record<string, number> = {};
    customers.forEach((o) => { const p = resolvePlan(o.plan); c[p.name] = (c[p.name] || 0) + billableMonthly(p, o.planStatus); });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [customers]);

  const activity = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; events: number; active: number }[] = [];
    const activeSets: Record<string, Set<string>> = {};
    for (let i = 13; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); const k = dayKey(d); buckets.push({ key: k, name: `${d.getDate()}/${d.getMonth() + 1}`, events: 0, active: 0 }); activeSets[k] = new Set(); }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const l of auditLogs) {
      const k = (l.timestamp || '').slice(0, 10);
      if (!idx.has(k)) continue;
      buckets[idx.get(k)!].events += 1;
      if (/auth|login|session/i.test(l.action)) activeSets[k].add(l.userName);
    }
    buckets.forEach((b) => { b.active = activeSets[b.key].size; });
    return buckets;
  }, [auditLogs]);
  const hasActivity = activity.some((a) => a.events > 0);

  const topOrgs = useMemo(() => {
    const c: Record<string, number> = {};
    users.forEach((u) => { if (!u.platformRole) c[u.organizationId] = (c[u.organizationId] || 0) + 1; });
    return customers.map((o) => ({ name: o.companyName, users: c[o.id] || 0, plan: resolvePlan(o.plan).name })).sort((a, b) => b.users - a.users).slice(0, 6);
  }, [customers, users]);
  const maxUsers = Math.max(...topOrgs.map((o) => o.users), 1);

  const kpis = [
    { label: 'Customers', value: String(summary.customers), icon: Building2 },
    { label: 'MRR', value: money(summary.mrr), icon: TrendingUp },
    { label: 'ARR', value: money(summary.arr), icon: CreditCard },
    { label: 'Org Users', value: String(summary.orgUsers), icon: Users },
    { label: 'Active Today', value: String(summary.activeToday), icon: Zap },
    { label: 'Trials', value: String(summary.trials), icon: Activity },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Platform Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">Growth, revenue and usage across all customer organizations — computed from live data.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => { const Icon = k.icon; return (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.label}</span><span className="h-8 w-8 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center"><Icon className="h-4 w-4" /></span></div>
            <span className="text-2xl font-bold text-slate-900 tabular-nums mt-2 block">{k.value}</span>
          </div>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Organization Growth" icon={TrendingUp}>
          {customers.length === 0 ? <EmptyState icon={Building2} title="No customers yet." size="sm" /> : (
            <div className="h-48"><ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orgGrowth} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C4CE1" stopOpacity={0.35} /><stop offset="100%" stopColor="#6C4CE1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="total" stroke="#6C4CE1" strokeWidth={2} fill="url(#og)" />
              </AreaChart>
            </ResponsiveContainer></div>
          )}
        </Panel>

        <Panel title="Plan Distribution" icon={CreditCard}>
          {planDist.length === 0 ? <EmptyState icon={CreditCard} title="No plans assigned." size="sm" /> : (
            <div className="flex items-center gap-3">
              <div className="h-40 w-40 shrink-0"><ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={planDist} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={2} dataKey="value">{planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} /></PieChart>
              </ResponsiveContainer></div>
              <div className="flex-1 space-y-1.5 min-w-0">{planDist.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-1.5 min-w-0"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-slate-600 truncate">{d.name}</span></span><span className="font-bold text-slate-800">{d.value}</span></div>
              ))}</div>
            </div>
          )}
        </Panel>

        <Panel title="MRR by Plan" icon={TrendingUp}>
          {mrrByPlan.length === 0 ? <EmptyState icon={TrendingUp} title="No revenue yet." size="sm" /> : (
            <div className="h-48"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrByPlan} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => money(Number(v))} />
                <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => money(Number(v))} />
                <Bar dataKey="value" fill="#6C4CE1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer></div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Panel title="Platform Activity — Last 14 Days" icon={Activity}>
            {!hasActivity ? <EmptyState icon={Activity} title="No activity recorded yet." size="sm" /> : (
              <div className="h-56"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} /><YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="events" name="Events" fill="#c7bafc" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="active" name="Active users" fill="#6C4CE1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            )}
          </Panel>
        </div>

        <Panel title="Top Organizations" icon={Trophy}>
          {topOrgs.length === 0 ? <EmptyState icon={Trophy} title="No organizations yet." size="sm" /> : (
            <div className="space-y-3">{topOrgs.map((o, i) => (
              <div key={o.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700 truncate max-w-[150px] flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-[#6C4CE1]/10 text-[#6C4CE1] text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{o.name}</span><span className="font-bold text-slate-800 tabular-nums">{o.users}</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-5.5"><div className="h-full bg-[#6C4CE1] rounded-full" style={{ width: `${(o.users / maxUsers) * 100}%` }} /></div>
              </div>
            ))}</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
