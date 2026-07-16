import React, { useMemo } from 'react';
import { CalendarRange, ChevronRight, Ship } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, Vessel } from '@/types';
import { todayLocalDateString, isVoyageRelevantToday } from './kpis';

interface PlanningTimelineHeroProps {
  voyages: Voyage[];
  vessels: Vessel[];
  setView: (view: string) => void;
}

interface Block {
  label: string;
  time: string;
  ms: number;
  tone: string;
}

const HOUR = 3600_000;

// Milestone → colour, matching enterprise planning boards (arrival/marine/cargo/departure).
function toneFor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('eta') || l.includes('arriv') || l.includes('notice')) return 'bg-sky-100 text-sky-700 border-sky-200';
  if (l.includes('pilot')) return 'bg-violet-100 text-violet-700 border-violet-200';
  if (l.includes('berth') || l.includes('along') || l.includes('line') || l.includes('moor')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (l.includes('cargo') || l.includes('load') || l.includes('discharg')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (l.includes('crew')) return 'bg-teal-100 text-teal-700 border-teal-200';
  if (l.includes('water') || l.includes('bunker')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  if (l.includes('depart') || l.includes('sail') || l.includes('clearance') || l.includes('etd')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function hhmm(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function PlanningTimelineHero({ voyages, vessels, setView }: PlanningTimelineHeroProps) {
  const today = todayLocalDateString();

  const lanes = useMemo(() => {
    const todays = voyages.filter((v) => isVoyageRelevantToday(v, today));
    return todays.map((v) => {
      const blocks: Block[] = [];
      const push = (label: string, ts?: string) => {
        if (!ts) return;
        const ms = new Date(ts).getTime();
        if (Number.isNaN(ms)) return;
        blocks.push({ label, time: hhmm(ms), ms, tone: toneFor(label) });
      };
      push('ETA', v.actualEta || v.eta);
      v.timeline.forEach((t) => t.timestamp && push(t.event, t.timestamp));
      push('Departure', v.actualEtd || v.etd);
      blocks.sort((a, b) => a.ms - b.ms);
      const vessel = vessels.find((x) => x.id === v.vesselId);
      return { voyage: v, vessel, blocks };
    });
  }, [voyages, vessels, today]);

  // Shared time window across all lanes (clamped to today, padded by 1h).
  const { start, end, ticks } = useMemo(() => {
    const all = lanes.flatMap((l) => l.blocks.map((b) => b.ms));
    const base = new Date(today + 'T00:00').getTime();
    let s = base + 6 * HOUR;
    let e = base + 22 * HOUR;
    if (all.length) {
      s = Math.min(...all) - HOUR;
      e = Math.max(...all) + HOUR;
    }
    if (e - s < 6 * HOUR) e = s + 6 * HOUR;
    const span = e - s;
    const step = span > 14 * HOUR ? 4 * HOUR : span > 8 * HOUR ? 2 * HOUR : HOUR;
    const t: { pct: number; label: string }[] = [];
    const first = Math.ceil(s / step) * step;
    for (let m = first; m <= e; m += step) t.push({ pct: ((m - s) / span) * 100, label: hhmm(m) });
    return { start: s, end: e, ticks: t };
  }, [lanes, today]);

  const pct = (ms: number) => ((ms - start) / (end - start)) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-[#6C4CE1]" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Planning Timeline</h3>
            <p className="text-[10px] text-slate-400 font-medium">Today · {lanes.length} vessel{lanes.length === 1 ? '' : 's'} scheduled</p>
          </div>
        </div>
        <button onClick={() => setView('planning')} className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-1 cursor-pointer">
          <span className="hidden sm:inline">Planning Centre</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {lanes.length === 0 ? (
        <EmptyState icon={Ship} title="Nothing scheduled for today." description="Vessels arriving, berthing or departing today will plot on this schedule. Create a Port Call to begin." action={{ label: 'New Port Call', onClick: () => setView('voyages') }} />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Axis */}
            <div className="relative h-7 ml-44 mr-4 border-b border-slate-100">
              {ticks.map((t, i) => (
                <div key={i} className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: `${t.pct}%` }}>
                  <span className="text-[9px] text-slate-400 font-medium tabular-nums -translate-x-1/2">{t.label}</span>
                </div>
              ))}
            </div>

            {/* Lanes */}
            <div className="divide-y divide-slate-50">
              {lanes.map(({ voyage, vessel, blocks }) => (
                <div key={voyage.id} className="flex items-center hover:bg-slate-50/50 transition-colors">
                  <button onClick={() => setView('voyages')} className="w-44 shrink-0 px-4 py-3 text-left cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 block truncate">{voyage.vesselName}</span>
                    <span className="text-[10px] text-slate-400 tabular-nums">{voyage.voyageNumber}{vessel ? ` · ${vessel.status}` : ''}</span>
                  </button>
                  <div className="relative flex-1 h-12 mr-4">
                    {/* Track */}
                    {blocks.length > 1 && (
                      <div
                        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-100"
                        style={{ left: `${pct(blocks[0].ms)}%`, width: `${Math.max(pct(blocks[blocks.length - 1].ms) - pct(blocks[0].ms), 0)}%` }}
                      />
                    )}
                    {ticks.map((t, i) => (
                      <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-50" style={{ left: `${t.pct}%` }} />
                    ))}
                    {blocks.map((b, i) => (
                      <div
                        key={i}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 border rounded-md px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap shadow-xs ${b.tone}`}
                        style={{ left: `${Math.min(Math.max(pct(b.ms), 2), 98)}%` }}
                        title={`${b.label} · ${b.time}`}
                      >
                        {b.label} {b.time}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
              {[
                { l: 'Arrival', c: 'bg-sky-400' },
                { l: 'Pilot', c: 'bg-violet-400' },
                { l: 'Berth', c: 'bg-indigo-400' },
                { l: 'Cargo Ops', c: 'bg-amber-400' },
                { l: 'Departure', c: 'bg-emerald-400' },
              ].map((x) => (
                <span key={x.l} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${x.c}`} />
                  {x.l}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
