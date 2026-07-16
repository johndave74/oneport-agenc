import React from 'react';
import {
  Anchor,
  Ship,
  ArrowDownToLine,
  ArrowUpFromLine,
  UserCheck,
  Clock,
  AlertTriangle,
  CloudSun,
  Activity,
  LucideIcon,
} from 'lucide-react';
import { MaritimeWeather } from './weather';
import { OperationalHealth } from './commandData';

type Tone = 'ok' | 'info' | 'warn' | 'alert' | 'neutral';

interface StatusMetric {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
  tooltip: string;
  view: string;
}

interface OperationsStatusBarProps {
  activePortCalls: number;
  shipsAtBerth: number;
  arrivalsToday: number;
  departuresToday: number;
  pilotRequests: number;
  laytimeRunning: number;
  openIncidents: number;
  weather: MaritimeWeather;
  health: OperationalHealth;
  setView: (view: string) => void;
}

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-emerald-600',
  info: 'text-sky-600',
  warn: 'text-amber-600',
  alert: 'text-rose-600',
  neutral: 'text-slate-500',
};

const WEATHER_TONE: Record<MaritimeWeather['severity'], Tone> = {
  good: 'ok',
  watch: 'warn',
  alert: 'alert',
};

export default function OperationsStatusBar({
  activePortCalls,
  shipsAtBerth,
  arrivalsToday,
  departuresToday,
  pilotRequests,
  laytimeRunning,
  openIncidents,
  weather,
  health,
  setView,
}: OperationsStatusBarProps) {
  const globalTone: Tone = health.label === 'Critical' ? 'alert' : health.label === 'Warning' ? 'warn' : 'ok';

  const metrics: StatusMetric[] = [
    { icon: Anchor, label: 'Active Port Calls', value: activePortCalls, tone: 'info', tooltip: 'Voyages currently in progress (not completed).', view: 'voyages' },
    { icon: Ship, label: 'Ships at Berth', value: shipsAtBerth, tone: 'info', tooltip: 'Vessels berthed or in cargo operations.', view: 'vessels' },
    { icon: ArrowDownToLine, label: 'Arrivals Today', value: arrivalsToday, tone: arrivalsToday ? 'ok' : 'neutral', tooltip: 'Vessels scheduled to arrive today with no actual ETA logged yet.', view: 'voyages' },
    { icon: ArrowUpFromLine, label: 'Departures Today', value: departuresToday, tone: departuresToday ? 'ok' : 'neutral', tooltip: 'Vessels scheduled to depart today with no actual ETD logged yet.', view: 'voyages' },
    { icon: UserCheck, label: 'Pilot Requests', value: pilotRequests, tone: pilotRequests ? 'warn' : 'neutral', tooltip: 'Active port calls awaiting a pilot boarding milestone.', view: 'planning' },
    { icon: Clock, label: 'Laytime Running', value: laytimeRunning, tone: laytimeRunning ? 'info' : 'neutral', tooltip: 'Laytime calculations in draft or sent for approval.', view: 'laytime' },
    { icon: AlertTriangle, label: 'Open Incidents', value: openIncidents, tone: openIncidents ? 'alert' : 'ok', tooltip: 'Incidents not yet resolved.', view: 'approvals' },
    { icon: CloudSun, label: weather.seaState, value: `${weather.windKts}kt`, tone: WEATHER_TONE[weather.severity], tooltip: `${weather.port}: ${weather.summary}. Wind ${weather.windKts}kt ${weather.windDir}, swell ${weather.swellM}m, vis ${weather.visibilityKm}km.`, view: 'planning' },
    { icon: Activity, label: 'System Health', value: `${health.score}%`, tone: globalTone, tooltip: health.reasons.length ? health.reasons.join(' · ') : 'All operational checks within threshold.', view: 'reports' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex items-stretch overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-r border-slate-100 shrink-0 bg-slate-50/60">
        <span className={`h-2.5 w-2.5 rounded-full ${globalTone === 'alert' ? 'bg-rose-500' : globalTone === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
        <div className="leading-tight">
          <span className="text-xs font-bold text-slate-700 block">Operations Status</span>
          <span className={`text-[9px] tabular-nums font-bold uppercase tracking-wider ${TONE_TEXT[globalTone]}`}>
            {globalTone === 'ok' ? 'All Systems Normal' : globalTone === 'warn' ? 'Attention Needed' : 'Action Required'}
          </span>
        </div>
      </div>

      <div className="flex items-stretch overflow-x-auto flex-1 divide-x divide-slate-100">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.label}
              onClick={() => setView(m.view)}
              title={m.tooltip}
              className="group flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer text-left"
            >
              <Icon className={`h-4 w-4 shrink-0 ${TONE_TEXT[m.tone]}`} />
              <div className="leading-tight">
                <span className="text-sm font-bold text-slate-800 block tabular-nums group-hover:text-[#6C4CE1] transition-colors">{m.value}</span>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{m.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
