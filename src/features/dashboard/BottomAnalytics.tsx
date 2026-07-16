import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Ship, Building2, Users, ArrowDownToLine, Timer, ArrowRight, Star } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, Vessel, Invoice, LaytimeCalculation, Partner, User, Task } from '@/types';
import { getLaytimeMath } from '@/lib/laytime';
import { topPrincipals, mostActiveAgents, upcomingArrivals, money } from './commandData';

interface BottomAnalyticsProps {
  voyages: Voyage[];
  vessels: Vessel[];
  invoices: Invoice[];
  laytimeCalculations: LaytimeCalculation[];
  partners: Partner[];
  users: User[];
  tasks: Task[];
  setView: (view: string) => void;
}

const PIE_COLORS = ['#6C4CE1', '#26a69a', '#00bcd4', '#f59e0b', '#e11d48', '#3f51b5', '#8b5cf6'];

function Panel({ title, icon: Icon, action, children, className = '' }: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#6C4CE1]" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function BottomAnalytics({
  voyages,
  vessels,
  invoices,
  laytimeCalculations,
  partners,
  users,
  tasks,
  setView,
}: BottomAnalyticsProps) {
  // Monthly port calls (last 6 months by ETA)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, name: d.toLocaleDateString(undefined, { month: 'short' }), count: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const v of voyages) {
      const k = (v.eta || '').slice(0, 7);
      if (idx.has(k)) buckets[idx.get(k)!].count += 1;
    }
    return buckets;
  }, [voyages]);

  // Revenue trend (last 7 days of paid invoices)
  const revenueData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets.push({ key, name: d.toLocaleDateString(undefined, { weekday: 'short' }), value: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const inv of invoices) {
      if (inv.status !== 'Paid') continue;
      const k = (inv.issueDate || '').slice(0, 10);
      if (idx.has(k)) buckets[idx.get(k)!].value += inv.amount;
    }
    return buckets;
  }, [invoices]);
  const hasRevenue = revenueData.some(d => d.value > 0);

  // Laytime performance
  const laytime = useMemo(() => {
    let demurrage = 0, despatch = 0, onTrack = 0, demAmt = 0, desAmt = 0;
    for (const c of laytimeCalculations) {
      if (c.sofEvents.length < 2) { onTrack++; continue; }
      const m = getLaytimeMath(c);
      if (m.allowedHours <= 0) { onTrack++; continue; }
      if (m.isDemurrage) { demurrage++; demAmt += m.financialAmount; }
      else { despatch++; desAmt += m.financialAmount; }
    }
    return { demurrage, despatch, onTrack, demAmt, desAmt, total: laytimeCalculations.length };
  }, [laytimeCalculations]);

  // Vessel distribution by type
  const vesselDist = useMemo(() => {
    const counts: Record<string, number> = {};
    vessels.forEach(v => { counts[v.vesselType || 'Other'] = (counts[v.vesselType || 'Other'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vessels]);

  const principals = useMemo(() => topPrincipals(partners, invoices, 5), [partners, invoices]);
  const agents = useMemo(() => mostActiveAgents(users, voyages, tasks, 5), [users, voyages, tasks]);
  const arrivals = useMemo(() => upcomingArrivals(voyages, new Date(), 5), [voyages]);
  const maxPrincipal = Math.max(...principals.map(p => p.revenue + p.outstanding), 1);

  const currency = invoices.find(i => i.currency)?.currency || 'USD';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-800">Operational Analytics</h3>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Executive Overview</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Monthly Port Calls */}
        <Panel title="Monthly Port Calls" icon={Ship}>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#6C4CE1" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Revenue Trend */}
        <Panel title="Revenue · Last 7 Days" icon={Timer} action={<button onClick={() => setView('invoices')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">Details</button>}>
          {hasRevenue ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C4CE1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6C4CE1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => money(Number(v), currency)} />
                  <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => money(Number(v), currency)} />
                  <Area type="monotone" dataKey="value" stroke="#6C4CE1" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Timer} title="No paid invoices yet." description="Revenue from paid invoices will chart here across the week." size="sm" />
          )}
        </Panel>

        {/* Laytime Performance */}
        <Panel title="Laytime Performance" icon={Timer} action={<button onClick={() => setView('laytime')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">Ledger</button>}>
          {laytime.total === 0 ? (
            <EmptyState icon={Timer} title="No laytime calculations." description="Demurrage & despatch performance appears here once SOFs are logged." size="sm" />
          ) : (
            <div className="space-y-3">
              {[
                { label: 'On Despatch', value: laytime.despatch, tone: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: 'On Demurrage', value: laytime.demurrage, tone: 'bg-rose-500', text: 'text-rose-600' },
                { label: 'In Progress', value: laytime.onTrack, tone: 'bg-slate-300', text: 'text-slate-500' },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-600 w-24 shrink-0">{r.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${(r.value / Math.max(laytime.total, 1)) * 100}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-5 text-right ${r.text}`}>{r.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-emerald-600 font-semibold">Despatch {money(laytime.desAmt, currency)}</span>
                <span className="text-rose-600 font-semibold">Demurrage {money(laytime.demAmt, currency)}</span>
              </div>
            </div>
          )}
        </Panel>

        {/* Top Principals */}
        <Panel title="Top Principals" icon={Building2} action={<button onClick={() => setView('partners')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">All</button>}>
          {principals.length === 0 ? (
            <EmptyState icon={Building2} title="No principals with billing yet." description="Add principals and raise invoices to rank your top accounts." size="sm" />
          ) : (
            <div className="space-y-3">
              {principals.map((p, i) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[150px] flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded bg-[#6C4CE1]/10 text-[#6C4CE1] text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="font-bold text-slate-800 tabular-nums">{money(p.revenue, currency)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-5.5">
                    <div className="h-full bg-[#6C4CE1] rounded-full" style={{ width: `${((p.revenue + p.outstanding) / maxPrincipal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Most Active Agents */}
        <Panel title="Most Active Agents" icon={Users} action={<button onClick={() => setView('crm')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">Directory</button>}>
          {agents.length === 0 ? (
            <EmptyState icon={Users} title="No agent workload yet." description="Assign agents to port calls and tasks to see activity ranking." size="sm" />
          ) : (
            <div className="space-y-2.5">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center text-[10px] font-bold shrink-0">
                    {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-700 block truncate">{a.name}</span>
                    <span className="text-[10px] text-slate-400">{a.role}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800">{a.activePortCalls}</span>
                    <span className="text-[9px] text-slate-400 block">port calls</span>
                  </div>
                  {a.rating != null && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{a.rating}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Upcoming Arrivals */}
        <Panel title="Upcoming Arrivals" icon={ArrowDownToLine} action={<button onClick={() => setView('planning')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">Planning</button>}>
          {arrivals.length === 0 ? (
            <EmptyState icon={ArrowDownToLine} title="No scheduled arrivals." description="Vessels with a future ETA will queue here." size="sm" />
          ) : (
            <div className="space-y-2.5">
              {arrivals.map((a) => (
                <button key={a.voyage.id} onClick={() => setView('voyages')} className="w-full flex items-center justify-between gap-2 hover:bg-slate-50 -mx-1 px-1 py-1 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-6 w-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <Ship className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 text-left">
                      <span className="text-xs font-semibold text-slate-700 block truncate max-w-[130px]">{a.voyage.vesselName}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{a.voyage.eta.replace('T', ' ').slice(5, 16)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 shrink-0">
                    {a.hoursAway < 24 ? `${Math.round(a.hoursAway)}h` : `${Math.round(a.hoursAway / 24)}d`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* Vessel Distribution */}
        <Panel title="Vessel Distribution" icon={Ship} action={<button onClick={() => setView('vessels')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">Registry</button>}>
          {vesselDist.length === 0 ? (
            <EmptyState icon={Ship} title="No vessels registered." description="Register vessels to see fleet composition by type." size="sm" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-36 w-36 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vesselDist} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {vesselDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-slate-800">{vessels.length}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Vessels</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {vesselDist.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600 truncate">{d.name}</span>
                    </span>
                    <span className="font-bold text-slate-800 shrink-0">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
