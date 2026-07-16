import React, { useMemo, useState } from 'react';
import { Radar, ChevronRight, ArrowRight, Anchor } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, Vessel, User, Invoice, LaytimeCalculation, Expense } from '@/types';
import { todayLocalDateString, isVoyageRelevantToday } from './kpis';

interface TodaysOperationsProps {
  voyages: Voyage[];
  vessels: Vessel[];
  users: User[];
  invoices: Invoice[];
  laytimeCalculations: LaytimeCalculation[];
  expenses: Expense[];
  currentUserId?: string;
  setView: (view: string) => void;
}

type Filter = 'today' | 'active' | 'mine';

const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'bg-slate-100 text-slate-700 border-slate-200',
  Arriving: 'bg-amber-50 text-amber-700 border-amber-200',
  Approaching: 'bg-amber-50 text-amber-700 border-amber-200',
  Berthed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Cargo Operations': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Departing: 'bg-sky-50 text-sky-700 border-sky-200',
  Completed: 'bg-slate-100 text-slate-500 border-slate-200',
  Delayed: 'bg-rose-50 text-rose-700 border-rose-200',
};

function agentName(users: User[], v: Voyage): string {
  const id = v.portAgentId || v.shipAgentId || v.protectiveAgentId;
  if (!id) return 'Unassigned';
  return users.find(u => u.id === id)?.name || 'Unassigned';
}

function pilotState(v: Voyage): { label: string; tone: string } {
  const ev = v.timeline.find(t => t.event.toLowerCase().includes('pilot'));
  if (!ev) return { label: '—', tone: 'text-slate-300' };
  return ev.completed
    ? { label: 'Onboard', tone: 'text-emerald-600' }
    : { label: 'Requested', tone: 'text-amber-600' };
}

function sofState(calcs: LaytimeCalculation[], voyageId: string): { label: string; tone: string } {
  const calc = calcs.find(c => c.voyageId === voyageId);
  if (!calc) return { label: 'Not started', tone: 'text-slate-400' };
  if (calc.status === 'Approved') return { label: 'Approved', tone: 'text-emerald-600' };
  if (calc.status === 'Disputed') return { label: 'Disputed', tone: 'text-rose-600' };
  return { label: `${calc.sofEvents.length} events`, tone: 'text-sky-600' };
}

function fdaState(expenses: Expense[], voyageId: string): { label: string; tone: string } {
  const rows = expenses.filter(e => e.voyageId === voyageId);
  if (rows.length === 0) return { label: '—', tone: 'text-slate-300' };
  if (rows.some(e => e.status === 'Pending Approval')) return { label: 'Pending', tone: 'text-amber-600' };
  if (rows.every(e => e.status === 'Approved')) return { label: 'Approved', tone: 'text-emerald-600' };
  if (rows.some(e => e.status === 'Rejected')) return { label: 'Flagged', tone: 'text-rose-600' };
  return { label: 'Estimated', tone: 'text-slate-500' };
}

export default function TodaysOperations({
  voyages,
  vessels,
  users,
  invoices,
  laytimeCalculations,
  expenses,
  currentUserId,
  setView,
}: TodaysOperationsProps) {
  const [filter, setFilter] = useState<Filter>('today');
  const today = todayLocalDateString();

  const principalByVoyage = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      if (inv.voyageId && inv.partnerName && !map.has(inv.voyageId)) map.set(inv.voyageId, inv.partnerName);
    }
    return map;
  }, [invoices]);

  const rows = useMemo(() => {
    const active = voyages.filter(v => v.status !== 'Completed');
    let list: Voyage[];
    if (filter === 'today') list = voyages.filter(v => isVoyageRelevantToday(v, today));
    else if (filter === 'mine') list = active.filter(v => v.portAgentId === currentUserId || v.shipAgentId === currentUserId || v.protectiveAgentId === currentUserId);
    else list = active;
    return list.sort((a, b) => new Date(a.eta || 0).getTime() - new Date(b.eta || 0).getTime());
  }, [voyages, filter, today, currentUserId]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'active', label: 'All Active' },
    { key: 'mine', label: 'My Port Calls' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-[#6C4CE1]" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">Today's Operations</h4>
            <p className="text-[10px] text-slate-400 font-medium">{rows.length} vessel{rows.length === 1 ? '' : 's'} in scope · live board</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  filter === f.key ? 'bg-white text-[#6C4CE1] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => setView('voyages')} className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-1 cursor-pointer shrink-0">
            <span className="hidden sm:inline">Full Log</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Anchor}
          title={filter === 'mine' ? 'No port calls assigned to you.' : filter === 'today' ? 'No port calls scheduled for today.' : 'No active port calls.'}
          description="Create a new Port Call to begin managing vessel operations — arrivals, berthing, cargo and departures."
          action={{ label: 'New Port Call', onClick: () => setView('voyages') }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100 bg-slate-50/40">
                <th className="py-2 px-4">Vessel</th>
                <th className="py-2 px-3">Principal</th>
                <th className="py-2 px-3">ETA</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Agent</th>
                <th className="py-2 px-3">Pilot</th>
                <th className="py-2 px-3">SOF</th>
                <th className="py-2 px-3">FDA</th>
                <th className="py-2 px-3 w-28">Progress</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((v) => {
                const vessel = vessels.find(x => x.id === v.vesselId);
                const status = vessel?.status || v.status;
                const completed = v.timeline.filter(t => t.completed).length;
                const total = v.timeline.length;
                const pct = total ? Math.round((completed / total) * 100) : 0;
                const pilot = pilotState(v);
                const sof = sofState(laytimeCalculations, v.id);
                const fda = fdaState(expenses, v.id);
                const principal = principalByVoyage.get(v.id) || '—';
                const delayed = v.actualEta && v.eta && new Date(v.actualEta).getTime() > new Date(v.eta).getTime() + 3.6e6;

                return (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {v.vesselName.replace(/^(MV|MT|MS)\s+/i, '')[0]}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[150px]">{v.vesselName}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">{v.voyageNumber}{vessel ? ` · ${vessel.vesselType}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-600 truncate max-w-[120px]">{principal}</td>
                    <td className="py-2 px-3 text-[11px] tabular-nums text-slate-600">
                      <span className={delayed ? 'text-rose-600' : ''}>{v.eta ? v.eta.replace('T', ' ').slice(5) : '—'}</span>
                      {delayed && <span className="block text-[9px] text-rose-500 font-bold">DELAYED</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[status] || STATUS_BADGE.Scheduled}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-600 truncate max-w-[110px]">{agentName(users, v)}</td>
                    <td className={`py-2 px-3 text-[11px] font-semibold ${pilot.tone}`}>{pilot.label}</td>
                    <td className={`py-2 px-3 text-[11px] font-semibold ${sof.tone}`}>{sof.label}</td>
                    <td className={`py-2 px-3 text-[11px] font-semibold ${fda.tone}`}>{fda.label}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-[#6C4CE1]'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] tabular-nums text-slate-400 shrink-0 w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button onClick={() => setView('voyages')} className="text-[11px] font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 inline-flex items-center gap-1 cursor-pointer">
                        Open <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
