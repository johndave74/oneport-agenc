import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage } from '@/types';
import { todayLocalDateString, isVoyageRelevantToday } from './kpis';

interface PlanningPreviewProps {
  voyages: Voyage[];
  setView: (view: string) => void;
}

export default function PlanningPreview({ voyages, setView }: PlanningPreviewProps) {
  const today = todayLocalDateString();
  const todaysVoyages = voyages.filter(v => isVoyageRelevantToday(v, today));

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-[#6C4CE1]" />
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Planning Centre</h4>
            <p className="text-[10px] text-slate-400 font-mono">Today, {today}</p>
          </div>
        </div>
        <button
          onClick={() => setView('planning')}
          className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer shrink-0"
        >
          <span>Go to Planning Centre</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {todaysVoyages.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nothing scheduled for today."
          description="Voyages with an ETA, ETB, or ETD today will show their milestone progress here."
          size="sm"
        />
      ) : (
        <div className="p-4 space-y-4">
          {todaysVoyages.map(v => {
            const total = v.timeline.length;
            const completed = v.timeline.filter(t => t.completed).length;
            const nextPending = v.timeline.find(t => !t.completed);
            return (
              <div key={v.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{v.vesselName}</span>
                  <span className="text-slate-400 font-mono">{v.voyageNumber}</span>
                </div>
                {total > 0 && (
                  <div className="flex items-center gap-1">
                    {v.timeline.map((t, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full ${t.completed ? 'bg-[#6C4CE1]' : 'bg-slate-100'}`}
                        title={t.event}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{completed}/{total} milestones complete</span>
                  {nextPending && <span className="truncate max-w-[160px]">Next: {nextPending.event}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
