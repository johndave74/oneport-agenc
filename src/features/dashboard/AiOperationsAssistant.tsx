import React from 'react';
import { Bell, ShieldCheck, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { RuleFinding } from './aiRulesEngine';

interface OperationalAlertsProps {
  findings: RuleFinding[];
  setView: (view: string) => void;
}

const SEVERITY_STYLES: Record<RuleFinding['severity'], { dot: string; badge: string; label: string }> = {
  critical: { dot: 'bg-rose-500', badge: 'text-rose-700 bg-rose-50 border-rose-100', label: 'High' },
  warning: { dot: 'bg-amber-500', badge: 'text-amber-700 bg-amber-50 border-amber-100', label: 'Medium' },
  info: { dot: 'bg-sky-500', badge: 'text-sky-700 bg-sky-50 border-sky-100', label: 'Low' },
};

export default function OperationalAlerts({ findings, setView }: OperationalAlertsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 text-[#6C4CE1]" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operational Alerts{findings.length > 0 ? ` (${findings.length})` : ''}</h4>
        </div>
      </div>

      {findings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No operational risks detected."
          description="All laytime, expense, incident, and milestone checks are currently within threshold."
          size="sm"
        />
      ) : (
        <div className="p-2 divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {findings.map((f) => {
            const style = SEVERITY_STYLES[f.severity];
            return (
              <button
                key={f.id}
                onClick={() => setView(f.view)}
                className="w-full text-left p-3 hover:bg-slate-50/70 rounded-lg transition-colors flex items-start space-x-2.5"
              >
                <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">{f.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${style.badge}`}>{style.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{f.detail}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-1.5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
