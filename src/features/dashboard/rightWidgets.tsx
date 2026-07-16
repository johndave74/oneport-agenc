import React from 'react';
import {
  Wind,
  Eye,
  Waves,
  CloudRain,
  Thermometer,
  Activity as ActivityIcon,
  History,
  CheckSquare,
  Check,
  Clock,
  Bell,
  ShieldCheck,
  ChevronRight,
  Droplets,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Task, Notification } from '@/types';
import { MaritimeWeather } from './weather';
import { ActivityItem, OperationalHealth } from './commandData';

// ------------------------------------------------------------- Card shell

function Card({ title, icon: Icon, action, children }: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#6C4CE1]" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// --------------------------------------------------------------- Weather

const WEATHER_BADGE: Record<MaritimeWeather['severity'], string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  watch: 'bg-amber-50 text-amber-700 border-amber-100',
  alert: 'bg-rose-50 text-rose-700 border-rose-100',
};

export function WeatherWidget({ weather }: { weather: MaritimeWeather }) {
  const cells = [
    { icon: Wind, label: 'Wind', value: `${weather.windKts} kt ${weather.windDir}` },
    { icon: Eye, label: 'Visibility', value: `${weather.visibilityKm} km` },
    { icon: Waves, label: 'Sea State', value: weather.seaState },
    { icon: Droplets, label: 'Swell', value: `${weather.swellM} m` },
    { icon: CloudRain, label: 'Rain', value: `${weather.rainChancePct}%` },
    { icon: Thermometer, label: 'Temp', value: `${weather.temperatureC}°C` },
  ];
  return (
    <Card title="Maritime Weather" icon={CloudRain}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800">{weather.port}</span>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug max-w-[180px]">{weather.summary}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase shrink-0 ${WEATHER_BADGE[weather.severity]}`}>
            {weather.severity === 'good' ? 'Fair' : weather.severity === 'watch' ? 'Marginal' : 'Heavy'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cells.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <Icon className="h-3.5 w-3.5 text-slate-400 mx-auto" />
                <span className="text-[11px] font-bold text-slate-800 block mt-1 tabular-nums">{c.value}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wide">{c.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-2.5">{weather.advisory}</p>
      </div>
    </Card>
  );
}

// ------------------------------------------------------- Operational health

export function OperationalHealthWidget({ health, setView }: { health: OperationalHealth; setView: (v: string) => void }) {
  const color = health.label === 'Normal' ? '#10b981' : health.label === 'Warning' ? '#f59e0b' : '#e11d48';
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - health.score / 100);
  return (
    <Card title="Operational Health" icon={ActivityIcon}>
      <div className="p-4 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle cx="30" cy="30" r="26" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-800 tabular-nums">{health.score}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-sm font-bold" style={{ color }}>{health.label}</span>
          {health.attentionCount > 0 ? (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              {health.attentionCount} port call{health.attentionCount > 1 ? 's' : ''} require attention.
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">All operational checks within threshold.</p>
          )}
          {health.reasons.length > 0 && (
            <button onClick={() => setView('approvals')} className="text-[11px] font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 mt-1.5 inline-flex items-center gap-0.5 cursor-pointer">
              Review <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {health.reasons.length > 0 && (
        <div className="px-4 pb-4 space-y-1.5">
          {health.reasons.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="capitalize">{r}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// --------------------------------------------------------- Recent activity

const ACTIVITY_DOT: Record<ActivityItem['kind'], string> = {
  audit: 'bg-sky-400',
  milestone: 'bg-emerald-400',
  invoice: 'bg-[#6C4CE1]',
  incident: 'bg-rose-400',
};

export function RecentActivityWidget({ items }: { items: ActivityItem[] }) {
  return (
    <Card title="Recent Activity" icon={History}>
      {items.length === 0 ? (
        <EmptyState icon={History} title="No recent activity." description="Milestones, approvals and incidents will stream here as your team works." size="sm" />
      ) : (
        <div className="p-3 max-h-80 overflow-y-auto">
          <div className="relative pl-4">
            <span className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-100" />
            {items.map((it) => (
              <div key={it.id} className="relative pb-3 last:pb-0">
                <span className={`absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${ACTIVITY_DOT[it.kind]}`} />
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] tabular-nums font-bold text-slate-400 shrink-0 tabular-nums">{it.time}</span>
                  <span className="text-[11px] font-semibold text-slate-700 leading-snug">{it.label}</span>
                </div>
                {it.detail && <p className="text-[10px] text-slate-400 leading-snug mt-0.5 ml-9 truncate">{it.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------- My tasks

export function MyTasksWidget({ tasks, onCompleteTask, setView }: {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  setView: (v: string) => void;
}) {
  const now = Date.now();
  return (
    <Card
      title="My Assigned Tasks"
      icon={CheckSquare}
      action={
        <button onClick={() => setView('tasks')} className="text-[11px] font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-0.5 cursor-pointer">
          Taskboard <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="All clear!" description="You have no open tasks. New assignments will appear here." size="sm" />
      ) : (
        <div className="p-2 divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {tasks.slice(0, 6).map((t) => {
            const overdue = t.dueDate && new Date(t.dueDate).getTime() < now;
            return (
              <div key={t.id} className="p-2.5 flex items-start justify-between gap-2 hover:bg-slate-50/60 rounded-lg transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[140px]">{t.title}</span>
                    <span className="px-1 py-0.5 rounded text-[9px] tabular-nums bg-[#6C4CE1]/10 text-[#6C4CE1] font-semibold shrink-0">{t.voyageNumber}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] mt-1 ${overdue ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    <Clock className="h-3 w-3" />
                    {overdue ? 'Overdue · ' : 'Due '}{t.dueDate ? t.dueDate.replace('T', ' ').slice(5, 16) : '—'}
                  </span>
                </div>
                <button
                  onClick={() => onCompleteTask(t.id)}
                  title="Mark complete"
                  className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 p-1.5 rounded-lg border border-emerald-200 hover:border-emerald-500 transition-all shrink-0 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// -------------------------------------------------------- Notifications

const NOTIF_BADGE: Record<Notification['type'], string> = {
  Alert: 'bg-rose-100 text-rose-700',
  Reminder: 'bg-amber-100 text-amber-700',
  System: 'bg-[#6C4CE1]/15 text-[#6C4CE1]',
};

export function NotificationsWidget({ notifications, onMarkAllRead, setView }: {
  notifications: Notification[];
  onMarkAllRead: () => void;
  setView: (v: string) => void;
}) {
  const unread = notifications.filter(n => n.status === 'Unread').length;
  return (
    <Card
      title="Notifications"
      icon={Bell}
      action={
        unread > 0 ? (
          <button onClick={onMarkAllRead} className="text-[11px] font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 cursor-pointer">Mark all read</button>
        ) : (
          <button onClick={() => setView('notifications')} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer">View all</button>
        )
      }
    >
      {notifications.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="You're all caught up." description="Actionable alerts — approvals, expiries, ETA changes — will surface here." size="sm" />
      ) : (
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {notifications.slice(0, 6).map((n) => (
            <button
              key={n.id}
              onClick={() => setView('notifications')}
              className={`w-full text-left p-3 flex items-start gap-2.5 transition-colors cursor-pointer ${n.status === 'Unread' ? 'bg-[#6C4CE1]/[0.04] hover:bg-[#6C4CE1]/[0.07]' : 'hover:bg-slate-50/60'}`}
            >
              {n.status === 'Unread' && <span className="h-1.5 w-1.5 rounded-full bg-[#6C4CE1] mt-1.5 shrink-0" />}
              <div className={`flex-1 min-w-0 ${n.status === 'Read' ? 'ml-4' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${NOTIF_BADGE[n.type]}`}>{n.type}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{(n.createdAt || '').replace('T', ' ').slice(5, 16)}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug mt-1">{n.message}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
