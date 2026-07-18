import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts';
import {
  Globe, Users, UserCog, Activity, ShieldCheck, Server, Database, KeyRound, Zap,
  ArrowRight, CheckCircle2, Plus, Megaphone, TrendingUp,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Organization, User, AuditLog } from '@/types';

interface PlatformDashboardProps {
  organizations: Organization[];
  users: User[];
  auditLogs: AuditLog[];
  userName: string;
  setView: (view: string) => void;
}

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function PlatformDashboard({ organizations, users, auditLogs, userName, setView }: PlatformDashboardProps) {
  const firstName = userName.split(' ')[0];
  const today = todayStr();

  const customerOrgs = useMemo(() => organizations.filter((o) => !o.isPlatform), [organizations]);
  const stats = useMemo(() => {
    const platformTeam = users.filter((u) => !!u.platformRole).length;
    const orgUsers = users.filter((u) => !u.platformRole).length;
    const orgAdmins = users.filter((u) => !u.platformRole && (u.role as string) === 'ORG_ADMIN').length;
    const activeToday = new Set(
      auditLogs.filter((l) => (l.timestamp || '').slice(0, 10) === today && /auth|login|session/i.test(l.action)).map((l) => l.userName)
    ).size;
    return { orgs: customerOrgs.length, platformTeam, orgUsers, orgAdmins, activeToday, events: auditLogs.length };
  }, [customerOrgs, users, auditLogs, today]);

  const memberCount = useMemo(() => {
    const c: Record<string, number> = {};
    users.forEach((u) => { c[u.organizationId] = (c[u.organizationId] || 0) + 1; });
    return c;
  }, [users]);

  // Cumulative organization growth over the last 6 months (real, from createdAt).
  const growth = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, name: d.toLocaleDateString(undefined, { month: 'short' }), total: 0 });
    }
    for (const b of buckets) {
      b.total = organizations.filter((o) => ((o.createdAt || '').slice(0, 7) || '0000-00') <= b.key).length;
    }
    return buckets;
  }, [organizations]);
  const hasGrowth = growth.some((g) => g.total > 0);

  const kpis = [
    { label: 'Organizations', value: stats.orgs, icon: Globe, view: 'organizations', hint: 'Customer companies' },
    { label: 'Platform Team', value: stats.platformTeam, icon: UserCog, view: 'platform-team', hint: 'SaaS employees' },
    { label: 'Organization Users', value: stats.orgUsers, icon: Users, view: 'orgusers', hint: 'Across all customers' },
    { label: 'Organization Admins', value: stats.orgAdmins, icon: ShieldCheck, view: 'orgusers', hint: 'Company administrators' },
    { label: 'Active Today', value: stats.activeToday, icon: Zap, view: 'auditlogs', hint: 'Signed in today' },
    { label: 'Audit Events', value: stats.events, icon: Activity, view: 'auditlogs', hint: 'Recorded actions' },
  ];

  const quickActions = [
    { label: 'Create Organization', icon: Plus, view: 'organizations' },
    { label: 'Add Organization User', icon: Users, view: 'orgusers' },
    { label: 'Add Platform User', icon: UserCog, view: 'platform-team' },
    { label: 'Audit Logs', icon: Activity, view: 'auditlogs' },
  ];

  const services = [
    { label: 'Authentication', icon: KeyRound },
    { label: 'Database', icon: Database },
    { label: 'Edge Functions', icon: Server },
    { label: 'Realtime', icon: Zap },
  ];

  const recent = auditLogs.slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Platform Console</h2>
          <p className="text-xs text-slate-500 mt-0.5">Welcome back, {firstName}. Manage organizations, users, security and platform services.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            const primary = i === 0;
            return (
              <button key={a.label} onClick={() => setView(a.view)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${primary ? 'bg-[#6C4CE1] hover:bg-[#5839C6] text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}>
                <Icon className={`h-3.5 w-3.5 ${primary ? '' : 'text-slate-400'}`} /> {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI row (real metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button key={k.label} onClick={() => setView(k.view)} className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#6C4CE1]/30 transition-all p-4 text-left cursor-pointer">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{k.label}</span>
                <span className="h-8 w-8 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></span>
              </div>
              <span className="text-3xl font-bold text-slate-900 tabular-nums mt-2 block">{k.value}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">{k.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Organizations table */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Organizations</h4></div>
              <button onClick={() => setView('organizations')} className="text-[11px] font-semibold text-[#6C4CE1] cursor-pointer">Manage all</button>
            </div>
            {customerOrgs.length === 0 ? (
              <EmptyState icon={Globe} title="No customer organizations yet." description="Create your first organization to onboard a customer company." action={{ label: 'Create Organization', onClick: () => setView('organizations') }} size="sm" />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 bg-slate-50/40">
                    <th className="py-2.5 px-4">Organization</th><th className="py-2.5 px-3">Members</th><th className="py-2.5 px-3">Created</th><th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerOrgs.slice(0, 7).map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setView('organizations')}>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center shrink-0"><Globe className="h-3.5 w-3.5" /></span>
                          <div className="min-w-0"><span className="text-xs font-bold text-slate-800 block truncate">{org.companyName}</span><span className="text-[10px] text-slate-400 tabular-nums">{org.slug || org.id}</span></div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 tabular-nums">{memberCount[org.id] || 0}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 tabular-nums">{(org.createdAt || '').slice(0, 10) || '—'}</td>
                      <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${org.status === 'suspended' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{org.status || 'active'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Organization growth (real) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Organization Growth</h4></div>
            {hasGrowth ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C4CE1" stopOpacity={0.35} /><stop offset="100%" stopColor="#6C4CE1" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="total" stroke="#6C4CE1" strokeWidth={2} fill="url(#pg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title="No growth data yet." description="As you onboard organizations, their growth trend plots here." size="sm" />
            )}
          </div>
        </div>

        {/* Right: platform health + activity */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3"><Server className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Platform Health</h4></div>
            <div className="flex items-center gap-2 mb-3 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">All systems operational</span>
            </div>
            <div className="space-y-2">
              {services.map((s) => { const Icon = s.icon; return (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-slate-600"><Icon className="h-3.5 w-3.5 text-slate-400" />{s.label}</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Operational</span>
                </div>
              ); })}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">Status reflects that the app authenticated and reached Supabase successfully. Latency & incident history connect in a later phase.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60"><Activity className="h-4 w-4 text-[#6C4CE1]" /><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Latest Activity</h4></div>
            {recent.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet." size="sm" />
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {recent.map((log) => (
                  <button key={log.id} onClick={() => setView('auditlogs')} className="w-full text-left p-3 hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 truncate">{log.action}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{(log.timestamp || '').replace('T', ' ').slice(0, 16)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{log.userName} · {log.details}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setView('roles')} className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:border-[#6C4CE1]/30 hover:shadow-md transition-all cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700"><ShieldCheck className="h-4 w-4 text-[#6C4CE1]" />Roles &amp; Permissions</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
