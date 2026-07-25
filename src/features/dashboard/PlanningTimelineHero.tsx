import React, { useMemo } from 'react';
import { CalendarRange, ChevronRight, Ship, ArrowDownToLine, ArrowUpFromLine, Anchor } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, Vessel } from '@/types';
import { todayLocalDateString } from './kpis';

interface PlanningTimelineHeroProps {
  voyages: Voyage[];
  vessels: Vessel[];
  setView: (view: string) => void;
}

const WINDOW_DAYS = 8; // today + next 7

const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'bg-slate-100 text-slate-700',
  Arriving: 'bg-amber-50 text-amber-700',
  Berthed: 'bg-indigo-50 text-indigo-700',
  'Cargo Operations': 'bg-emerald-50 text-emerald-700',
  Departing: 'bg-sky-50 text-sky-700',
  Completed: 'bg-slate-100 text-slate-500',
};

function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function timeOf(ts?: string): string {
  if (!ts || !ts.includes('T')) return '';
  return ts.split('T')[1].slice(0, 5);
}

interface Entry { voyage: Voyage; kind: 'arrival' | 'departure' | 'berth' | 'inport'; label: string }

export default function PlanningTimelineHero({ voyages, vessels, setView }: PlanningTimelineHeroProps) {
  const today = todayLocalDateString();

  const days = useMemo(() => {
    const out: { key: string; label: string; entries: Entry[] }[] = [];
    const active = voyages.filter((v) => v.status !== 'Completed');
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = dateKey(d);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
      const entries: Entry[] = [];
      for (const v of active) {
        const eta = v.actualEta || v.eta;
        const etb = v.actualEtb || v.etb;
        const etd = v.actualEtd || v.etd;
        const etaD = (eta || '').slice(0, 10);
        const etbD = (etb || '').slice(0, 10);
        const etdD = (etd || '').slice(0, 10);
        if (etaD === key) entries.push({ voyage: v, kind: 'arrival', label: `Arriving ${timeOf(eta)}`.trim() });
        else if (etdD === key) entries.push({ voyage: v, kind: 'departure', label: `Departing ${timeOf(etd)}`.trim() });
        else if (etbD === key) entries.push({ voyage: v, kind: 'berth', label: `Berthing ${timeOf(etb)}`.trim() });
        else if (etaD && etdD && etaD < key && key < etdD) entries.push({ voyage: v, kind: 'inport', label: 'In port' });
      }
      out.push({ key, label, entries });
    }
    return out;
  }, [voyages, today]);

  const anyEntries = days.some((d) => d.entries.length > 0);
  const KIND_ICON = { arrival: ArrowDownToLine, departure: ArrowUpFromLine, berth: Anchor, inport: Ship } as const;
  const KIND_TONE = { arrival: 'text-amber-500', departure: 'text-sky-500', berth: 'text-indigo-500', inport: 'text-emerald-500' } as const;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-[#6C4CE1]" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Planning Timeline</h3>
            <p className="text-[10px] text-slate-400 font-medium">Next 7 days · {days.reduce((s, d) => s + d.entries.length, 0)} scheduled movements</p>
          </div>
        </div>
        <button onClick={() => setView('planning')} className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-1 cursor-pointer">
          <span className="hidden sm:inline">Planning Centre</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {!anyEntries ? (
        <EmptyState icon={Ship} title="Nothing scheduled in the next 7 days." description="Vessels arriving, berthing or departing over the coming week will plot here. Create a Port Call to begin." action={{ label: 'New Port Call', onClick: () => setView('voyages') }} />
      ) : (
        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
          {days.filter((d) => d.entries.length > 0).map((day) => (
            <div key={day.key} className="flex">
              <div className={`w-28 shrink-0 px-4 py-3 border-r border-slate-100 ${day.key === today ? 'bg-[#6C4CE1]/[0.04]' : 'bg-slate-50/40'}`}>
                <span className={`text-xs font-bold ${day.key === today ? 'text-[#6C4CE1]' : 'text-slate-700'}`}>{day.label}</span>
                <span className="block text-[10px] text-slate-400 tabular-nums">{day.key.slice(5)}</span>
                <span className="block text-[10px] text-slate-400 mt-1">{day.entries.length} vessel{day.entries.length === 1 ? '' : 's'}</span>
              </div>
              <div className="flex-1 py-2 divide-y divide-slate-50">
                {day.entries.map((e, i) => {
                  const vessel = vessels.find((x) => x.id === e.voyage.vesselId);
                  const status = vessel?.status || e.voyage.status;
                  const Icon = KIND_ICON[e.kind];
                  return (
                    <button key={e.voyage.id + i} onClick={() => setView('voyages')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50/60 transition-colors cursor-pointer text-left">
                      <Icon className={`h-4 w-4 shrink-0 ${KIND_TONE[e.kind]}`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 block truncate">{e.voyage.vesselName}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">{e.voyage.voyageNumber} · {e.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[status] || STATUS_BADGE.Scheduled}`}>{status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
