import React, { useMemo, useState } from 'react';
import { FileClock, Plus, Trash2, ArrowRight, Info } from 'lucide-react';
import { Voyage, SOFEvent } from '@/types';

interface StatementOfFactsProps {
  voyage: Voyage;
  canEdit: boolean;
  onSave: (events: SOFEvent[]) => void;
  setView?: (view: string) => void;
}

const COUNTABLE_OPTIONS = [100, 75, 50, 25, 0];
const QUICK_EVENTS = [
  'NOR tendered', 'Pilot on board', 'All fast / Berthed', 'Cargo operations commenced',
  'Cargo operations completed', 'Stoppage — rain', 'Stoppage — breakdown', 'Hoses connected',
  'Documents on board', 'Vessel sailed',
];

function hoursBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Number.isFinite(ms) ? Math.max(0, ms) / 3.6e6 : 0;
}
function fmtHrs(h: number): string {
  const d = Math.floor(h / 24);
  const r = h - d * 24;
  return d > 0 ? `${d}d ${r.toFixed(1)}h` : `${h.toFixed(1)}h`;
}

export default function StatementOfFacts({ voyage, canEdit, onSave, setView }: StatementOfFactsProps) {
  const events = useMemo(
    () => [...(voyage.sofEvents || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [voyage.sofEvents]
  );

  const [ts, setTs] = useState('');
  const [desc, setDesc] = useState('');
  const [countable, setCountable] = useState(100);
  const [comments, setComments] = useState('');

  // Countable time = Σ (duration between consecutive events × the earlier event's %)
  const summary = useMemo(() => {
    let elapsed = 0, countableHrs = 0;
    for (let i = 0; i < events.length - 1; i++) {
      const dur = hoursBetween(events[i].timestamp, events[i + 1].timestamp);
      elapsed += dur;
      countableHrs += dur * (events[i].isCountable / 100);
    }
    return { elapsed, countableHrs };
  }, [events]);

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ts || !desc.trim()) return;
    const ev: SOFEvent = { id: `sof-${Date.now()}`, timestamp: ts, eventDescription: desc.trim(), isCountable: countable, comments: comments.trim() || undefined };
    onSave([...(voyage.sofEvents || []), ev]);
    setDesc(''); setComments(''); setCountable(100);
  };

  const removeEvent = (id: string) => onSave((voyage.sofEvents || []).filter((e) => e.id !== id));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <FileClock className="h-4.5 w-4.5 text-[#6C4CE1]" />
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">Statement of Facts (SOF)</h5>
        </div>
        {setView && (
          <button onClick={() => setView('laytime')} className="text-[11px] font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-1 cursor-pointer">
            Laytime Ledger <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <span className="text-lg font-bold text-slate-800 tabular-nums block">{events.length}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Events</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <span className="text-lg font-bold text-slate-800 tabular-nums block">{fmtHrs(summary.elapsed)}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Total elapsed</span>
        </div>
        <div className="bg-[#6C4CE1]/5 border border-[#6C4CE1]/15 rounded-lg p-3">
          <span className="text-lg font-bold text-[#6C4CE1] tabular-nums block">{fmtHrs(summary.countableHrs)}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Countable</span>
        </div>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-[11px] text-slate-500">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span>No SOF events yet. Log events like NOR tendered, cargo commenced, stoppages and completion — countable time flows into laytime.</span>
        </div>
      ) : (
        <div className="border border-slate-100 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-2 px-3">Time</th><th className="py-2 px-3">Event</th><th className="py-2 px-3 text-center">Countable</th>
                {canEdit && <th className="py-2 px-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 tabular-nums text-slate-600 whitespace-nowrap">{ev.timestamp.replace('T', ' ').slice(0, 16)}</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-800">{ev.eventDescription}</span>
                    {ev.comments && <span className="block text-[10px] text-slate-400">{ev.comments}</span>}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${ev.isCountable === 100 ? 'bg-emerald-50 text-emerald-700' : ev.isCountable === 0 ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>{ev.isCountable}%</span>
                  </td>
                  {canEdit && (
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => removeEvent(ev.id)} className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer" title="Remove event"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add event */}
      {canEdit && (
        <form onSubmit={addEvent} className="space-y-2.5 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EVENTS.map((q) => (
              <button key={q} type="button" onClick={() => setDesc(q)} className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors cursor-pointer ${desc === q ? 'bg-[#6C4CE1] text-white border-[#6C4CE1]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#6C4CE1]/40'}`}>{q}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input type="datetime-local" required value={ts} onChange={(e) => setTs(e.target.value)} className="sm:col-span-3 border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
            <input type="text" required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Event description" className="sm:col-span-4 border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
            <select value={countable} onChange={(e) => setCountable(Number(e.target.value))} title="Countable % towards laytime" className="sm:col-span-2 border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
              {COUNTABLE_OPTIONS.map((c) => <option key={c} value={c}>{c}% count</option>)}
            </select>
            <input type="text" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Remarks" className="sm:col-span-2 border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
            <button type="submit" className="sm:col-span-1 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer p-2" title="Add event"><Plus className="h-4 w-4" /></button>
          </div>
        </form>
      )}
    </div>
  );
}
