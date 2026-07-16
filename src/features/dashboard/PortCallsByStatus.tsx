import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, VesselStatus } from '@/types';

interface PortCallsByStatusProps {
  voyages: Voyage[];
  setView: (view: string) => void;
}

const STATUS_ORDER: VesselStatus[] = ['Scheduled', 'Arriving', 'Berthed', 'Cargo Operations', 'Departing', 'Completed'];
const STATUS_DOT: Record<string, string> = {
  Scheduled: 'bg-sky-400',
  Arriving: 'bg-amber-400',
  Berthed: 'bg-indigo-400',
  'Cargo Operations': 'bg-emerald-400',
  Departing: 'bg-rose-400',
  Completed: 'bg-slate-400',
};

export default function PortCallsByStatus({ voyages, setView }: PortCallsByStatusProps) {
  const counts: Record<string, number> = {};
  voyages.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
  const orderedStatuses = STATUS_ORDER.filter(s => counts[s] > 0);
  const otherStatuses = Object.keys(counts).filter(s => !STATUS_ORDER.includes(s as VesselStatus));
  const rows = [...orderedStatuses, ...otherStatuses];
  const maxCount = Math.max(...rows.map(s => counts[s]), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Port Calls by Status</h4>
        <button
          onClick={() => setView('voyages')}
          className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer"
        >
          <span>View all voyages</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Compass} title="No voyages recorded yet." description="Voyage status breakdown will appear here once a voyage exists." size="sm" />
      ) : (
        <div className="space-y-3">
          {rows.map((status) => (
            <div key={status} className="flex items-center gap-3">
              <div className="flex items-center space-x-1.5 w-40 shrink-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status] || 'bg-slate-400'}`} />
                <span className="text-xs text-slate-600 truncate">{status}</span>
              </div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`}
                  style={{ width: `${(counts[status] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-800 w-5 text-right shrink-0">{counts[status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
