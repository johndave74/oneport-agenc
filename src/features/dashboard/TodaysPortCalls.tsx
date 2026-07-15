import React from 'react';
import { CalendarCheck, ChevronRight, ArrowRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, Vessel, User } from '@/types';
import { todayLocalDateString, isVoyageRelevantToday } from './kpis';

interface TodaysPortCallsProps {
  voyages: Voyage[];
  vessels: Vessel[];
  users: User[];
  setView: (view: string) => void;
}

function resolveAgentName(users: User[], id?: string): string {
  if (!id) return 'Unassigned';
  return users.find(u => u.id === id)?.name || 'Unassigned';
}

export default function TodaysPortCalls({ voyages, vessels, users, setView }: TodaysPortCallsProps) {
  const today = todayLocalDateString();
  const todaysVoyages = voyages.filter(v => isVoyageRelevantToday(v, today));

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <CalendarCheck className="h-5 w-5 text-[#6C4CE1]" />
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Today's Port Calls</h4>
        </div>
        <button
          onClick={() => setView('voyages')}
          className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer"
        >
          <span>Full Voyage Log</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {todaysVoyages.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No port calls scheduled for today."
          description="Vessels arriving, berthing, or departing today will appear here."
          action={{ label: 'Register Vessel', onClick: () => setView('vessels') }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Vessel / Voyage</th>
                <th className="py-3 px-4">ETA / ETB / ETD</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todaysVoyages.map((voyage) => {
                const vessel = vessels.find(v => v.id === voyage.vesselId);
                const completed = voyage.timeline.filter(t => t.completed).length;
                const total = voyage.timeline.length;
                const pct = total ? Math.round((completed / total) * 100) : 0;
                const agentName = resolveAgentName(users, voyage.portAgentId || voyage.shipAgentId);

                return (
                  <tr key={voyage.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-lg bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                          {voyage.vesselName[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{voyage.vesselName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{voyage.voyageNumber}{vessel ? ` · ${vessel.vesselType}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-600">
                      <div>ETA: {voyage.eta ? voyage.eta.replace('T', ' ') : '—'}</div>
                      {voyage.etb && <div className="text-slate-400">ETB: {voyage.etb.replace('T', ' ')}</div>}
                      <div className="text-slate-400">ETD: {voyage.etd ? voyage.etd.replace('T', ' ') : '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        vessel?.status === 'Arriving' ? 'bg-amber-100 text-amber-800' :
                        vessel?.status === 'Berthed' ? 'bg-indigo-100 text-indigo-800' :
                        vessel?.status === 'Cargo Operations' ? 'bg-emerald-100 text-emerald-850' :
                        vessel?.status === 'Departing' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {voyage.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 w-32">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-[#6C4CE1]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{agentName}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setView('voyages')}
                        className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/85 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
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
