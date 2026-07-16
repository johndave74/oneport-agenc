import React from 'react';
import { Anchor, Ship, UserCheck, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

interface OperationsStatusBarProps {
  activePortCalls: number;
  shipsAtBerth: number;
  pilotPending: number;
  laytimeRunning: number;
  openIncidents: number;
  setView: (view: string) => void;
}

export default function OperationsStatusBar({ activePortCalls, shipsAtBerth, pilotPending, laytimeRunning, openIncidents, setView }: OperationsStatusBarProps) {
  const items = [
    { icon: Anchor, label: 'Active Port Calls', value: activePortCalls, color: 'text-sky-500' },
    { icon: Ship, label: 'Ships at Berth', value: shipsAtBerth, color: 'text-[#6C4CE1]' },
    { icon: UserCheck, label: 'Pilot Pending', value: pilotPending, color: 'text-amber-500' },
    { icon: Clock, label: 'Laytime Running', value: laytimeRunning, color: 'text-[#6C4CE1]' },
    { icon: AlertTriangle, label: 'Open Incidents', value: openIncidents, color: 'text-rose-500' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm flex flex-wrap items-center gap-x-8 gap-y-2">
      <div className="flex items-center space-x-2 pr-6 border-r border-slate-100">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-700">Operations Status</span>
        <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase">Live</span>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center space-x-2">
            <Icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-xs text-slate-500">{item.label}</span>
            <span className="text-sm font-bold text-slate-800">{item.value}</span>
          </div>
        );
      })}
      <button
        onClick={() => setView('voyages')}
        className="ml-auto flex items-center space-x-0.5 text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 cursor-pointer shrink-0"
      >
        <span>View All Status</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
