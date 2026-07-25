import React, { useState, useMemo } from 'react';
import { Vessel, Voyage, Task, User, Service, ServiceStatus, Partner } from '@/types';
import { motion } from 'motion/react';
import { Calendar, Ship, Anchor, Clock, AlertTriangle, ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine, Plus, Trash2, Wrench, X } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dayKey(d: Date): string { const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }

const SERVICE_TYPES = ['Pilotage', 'Tug Services', 'Mooring / Unmooring', 'Bunkering', 'Fresh Water', 'Waste Disposal', 'Customs Clearance', 'Immigration', 'Surveyor', 'Chandlery', 'Crew Transport'];
const SERVICE_STATUSES: ServiceStatus[] = ['Requested', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
const SERVICE_STATUS_COLOR: Record<ServiceStatus, string> = {
  Requested: 'bg-slate-100 text-slate-700', Confirmed: 'bg-sky-100 text-sky-700', 'In Progress': 'bg-amber-100 text-amber-700', Completed: 'bg-emerald-100 text-emerald-700', Cancelled: 'bg-rose-100 text-rose-700',
};

interface PlanningCenterViewProps {
  vessels: Vessel[];
  voyages: Voyage[];
  tasks: Task[];
  users: User[];
  services: Service[];
  partners: Partner[];
  onAddService: (s: Omit<Service, 'id' | 'createdAt'>) => void;
  onUpdateServiceStatus: (id: string, status: ServiceStatus) => void;
  onDeleteService: (id: string) => void;
}

const TAB_LABELS: Record<'schedule' | 'berth' | 'services' | 'calendar', string> = {
  schedule: 'Timeline',
  berth: 'Port Assignment',
  services: 'Services',
  calendar: 'Calendar'
};

export default function PlanningCenterView({ vessels, voyages, tasks, users, services, partners, onAddService, onUpdateServiceStatus, onDeleteService }: PlanningCenterViewProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'berth' | 'services' | 'calendar'>('schedule');
  const [svcModal, setSvcModal] = useState(false);
  const [svcForm, setSvcForm] = useState({ voyageId: '', serviceType: SERVICE_TYPES[0], providerId: '', scheduledAt: '', notes: '' });
  const providers = partners.filter((p) => p.type === 'Vendor' || p.type === 'Port Authority' || p.type === 'Terminal');
  const submitService = () => {
    if (!svcForm.voyageId) return;
    const voy = voyages.find((v) => v.id === svcForm.voyageId);
    const provider = providers.find((p) => p.id === svcForm.providerId);
    onAddService({
      voyageId: svcForm.voyageId, voyageNumber: voy?.voyageNumber || 'TBA', serviceType: svcForm.serviceType,
      providerId: svcForm.providerId || null, providerName: provider?.name, scheduledAt: svcForm.scheduledAt || undefined,
      status: 'Requested', notes: svcForm.notes || undefined,
    });
    setSvcForm({ voyageId: '', serviceType: SERVICE_TYPES[0], providerId: '', scheduledAt: '', notes: '' });
    setSvcModal(false);
  };
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });

  // Calendar events keyed by day (arrivals, departures, task due dates).
  const eventsByDay = useMemo(() => {
    const map: Record<string, { label: string; kind: 'arrival' | 'departure' | 'task' | 'service' }[]> = {};
    const add = (date: string | undefined, label: string, kind: 'arrival' | 'departure' | 'task' | 'service') => {
      if (!date) return; const k = date.slice(0, 10); (map[k] ||= []).push({ label, kind });
    };
    voyages.forEach((v) => { add(v.actualEta || v.eta, `${v.vesselName} arrives`, 'arrival'); add(v.actualEtd || v.etd, `${v.vesselName} departs`, 'departure'); });
    tasks.forEach((t) => add(t.dueDate, t.title, 'task'));
    services.forEach((s) => add(s.scheduledAt, `${s.serviceType} — ${s.voyageNumber}`, 'service'));
    return map;
  }, [voyages, tasks, services]);

  // Helper calculations
  const upcomingArrivals = voyages.filter(v => new Date(v.eta) >= new Date()).sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime());
  const destinationPorts = Array.from(new Set(upcomingArrivals.map(v => v.destinationPort).filter(Boolean)));
  
  // Conflict detection (simplified: two vessels at same berth/port arriving same day)
  const clashes = upcomingArrivals.reduce((acc: any[], v) => {
    const sameDay = upcomingArrivals.find(other => other.id !== v.id && other.destinationPort === v.destinationPort && new Date(other.eta).toDateString() === new Date(v.eta).toDateString());
    if (sameDay && !acc.find(c => c.v1 === v.id || c.v2 === v.id)) {
      acc.push({ v1: v.id, v2: sameDay.id, port: v.destinationPort, date: v.eta });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Planning Centre</h2>
          <p className="text-slate-500">Operations Command & Control</p>
        </div>
        
        {clashes.length > 0 && (
          <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border border-rose-200 flex items-center space-x-2 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">Potential Schedule Clashes Detected ({clashes.length})</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar space-x-2 pb-2">
        {(['schedule', 'berth', 'services', 'calendar'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#6C4CE1] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab === 'schedule' && <Clock className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
            {tab === 'berth' && <Anchor className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
            {tab === 'services' && <Wrench className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
            {tab === 'calendar' && <Calendar className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'schedule' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-[#6C4CE1]" />
                Timeline
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {upcomingArrivals.map((voyage, idx) => (
                  <div key={voyage.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#6C4CE1] text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 text-sm">{voyage.vesselName}</span>
                        <span className="text-xs tabular-nums font-bold text-[#6C4CE1] bg-[#F2EFFF] px-2 py-0.5 rounded-full">{new Date(voyage.eta).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Voyage: {voyage.voyageNumber}</div>
                      <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                        <span>ETA: {new Date(voyage.eta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="font-bold">{voyage.destinationPort}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingArrivals.length === 0 && (
                  <div className="text-center py-10 text-slate-500 font-medium">No upcoming arrivals</div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'berth' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Anchor className="w-5 h-5 mr-2 text-[#6C4CE1]" />
                Port Assignment
              </h3>
              {destinationPorts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-medium">No upcoming port calls to assign.</div>
              ) : (
                <div className="min-w-[600px]">
                   <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500">
                      {/* Next 7 days */}
                      {[...Array(7)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        return <div key={i}>{d.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}</div>
                      })}
                   </div>
                   <div className="space-y-3">
                     {/* Grouped by real destination port — no fabricated berth assignment */}
                     {destinationPorts.map(port => (
                       <div key={port} className="relative h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center">
                          <div className="absolute left-0 w-24 h-full bg-white border-r border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm z-10 rounded-l-xl px-1 text-center truncate">
                            {port}
                          </div>
                          <div className="ml-24 w-full h-full relative p-2">
                             {upcomingArrivals.filter(v => v.destinationPort === port).map(voyage => {
                                const vDate = new Date(voyage.eta);
                                const today = new Date();
                                const diffDays = Math.ceil((vDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                if (diffDays < 0 || diffDays >= 7) return null;

                                const etdDate = new Date(voyage.etd);
                                const spanDays = Math.min(7 - diffDays, Math.max(1, Math.ceil((etdDate.getTime() - vDate.getTime()) / (1000 * 60 * 60 * 24)) || 1));

                                return (
                                  <div
                                    key={voyage.id}
                                    className="absolute h-10 bg-[#6C4CE1] rounded-lg shadow text-white text-[10px] p-2 flex flex-col justify-center whitespace-nowrap overflow-hidden top-3"
                                    style={{ left: `${(diffDays / 7) * 100}%`, width: `${(spanDays / 7) * 100}%` }}
                                  >
                                    <span className="font-bold truncate">{voyage.vesselName}</span>
                                    <span className="opacity-80 truncate">{voyage.cargoType}</span>
                                  </div>
                                );
                             })}
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Wrench className="w-4.5 h-4.5 text-[#6C4CE1]" /> Marine Services</h3>
                <button onClick={() => setSvcModal(true)} className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"><Plus className="h-3.5 w-3.5" /> Book Service</button>
              </div>
              {services.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No services booked yet. Book pilotage, tugs, bunkering and more against a port call.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Service</th><th className="py-3 px-4">Port Call</th><th className="py-3 px-4">Provider</th><th className="py-3 px-4">Scheduled</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...services].sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || '')).map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-800">{s.serviceType}</td>
                          <td className="py-3 px-4"><span className="px-1.5 py-0.5 rounded text-[10px] bg-[#6C4CE1]/10 text-[#2D1B69] font-semibold">{s.voyageNumber}</span></td>
                          <td className="py-3 px-4 text-slate-600">{s.providerName || <span className="text-slate-400">—</span>}</td>
                          <td className="py-3 px-4 tabular-nums text-slate-500">{s.scheduledAt ? s.scheduledAt.replace('T', ' ').slice(0, 16) : '—'}</td>
                          <td className="py-3 px-4">
                            <select value={s.status} onChange={(e) => onUpdateServiceStatus(s.id, e.target.value as ServiceStatus)} className={`border-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none ${SERVICE_STATUS_COLOR[s.status]}`}>
                              {SERVICE_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => onDeleteService(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Remove service"><Trash2 className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'calendar' && (() => {
            const monthStart = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
            const gridStart = new Date(monthStart); gridStart.setDate(1 - monthStart.getDay());
            const cells = [...Array(42)].map((_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
            const todayKey = dayKey(new Date());
            const KIND = {
              arrival: { icon: ArrowDownToLine, cls: 'bg-amber-50 text-amber-700' },
              departure: { icon: ArrowUpFromLine, cls: 'bg-sky-50 text-sky-700' },
              task: { icon: Clock, cls: 'bg-[#6C4CE1]/10 text-[#6C4CE1]' },
              service: { icon: Wrench, cls: 'bg-teal-50 text-teal-700' },
            } as const;
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                      <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setCalMonth(d); }} className="text-xs font-semibold text-[#6C4CE1] hover:underline cursor-pointer">Today</button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Arrival</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" />Departure</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6C4CE1]" />Task</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                  {WEEKDAYS.map((w) => <div key={w} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{w}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map((d, i) => {
                    const k = dayKey(d);
                    const inMonth = d.getMonth() === calMonth.getMonth();
                    const isToday = k === todayKey;
                    const evs = eventsByDay[k] || [];
                    return (
                      <div key={i} className={`min-h-[92px] border-b border-r border-slate-100 p-1.5 ${inMonth ? 'bg-white' : 'bg-slate-50/40'} ${i % 7 === 0 ? 'border-l' : ''}`}>
                        <div className="flex justify-end">
                          <span className={`text-[11px] font-semibold h-5 w-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#6C4CE1] text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'}`}>{d.getDate()}</span>
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {evs.slice(0, 3).map((e, j) => {
                            const K = KIND[e.kind];
                            return <div key={j} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 truncate ${K.cls}`} title={e.label}><K.icon className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{e.label}</span></div>;
                          })}
                          {evs.length > 3 && <div className="text-[9px] text-slate-400 px-1.5">+{evs.length - 3} more</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
             <h4 className="font-bold text-slate-800 text-sm mb-4">Conflict Alerts</h4>
             {clashes.length > 0 ? (
               <div className="space-y-3">
                 {clashes.map((c, i) => (
                   <div key={i} className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-800 mb-1">Berth Clash - {c.port}</p>
                          <p className="text-[10px] text-rose-600">Multiple vessels scheduled for {new Date(c.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-6">
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                   <Calendar className="w-6 h-6 text-emerald-500" />
                 </div>
                 <p className="text-xs font-bold text-slate-600">Schedule Clear</p>
                 <p className="text-[10px] text-slate-500">No conflicts detected</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Book Service modal */}
      {svcModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Wrench className="h-4.5 w-4.5 text-[#6C4CE1]" /> Book Marine Service</h4>
              <button onClick={() => setSvcModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Port call *</label>
                <select value={svcForm.voyageId} onChange={(e) => setSvcForm((f) => ({ ...f, voyageId: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                  <option value="">— Choose port call —</option>
                  {voyages.filter((v) => v.status !== 'Completed').map((v) => <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Service</label>
                  <select value={svcForm.serviceType} onChange={(e) => setSvcForm((f) => ({ ...f, serviceType: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                    {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Provider</label>
                  <select value={svcForm.providerId} onChange={(e) => setSvcForm((f) => ({ ...f, providerId: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer">
                    <option value="">— Optional —</option>
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Scheduled time</label>
                <input type="datetime-local" value={svcForm.scheduledAt} onChange={(e) => setSvcForm((f) => ({ ...f, scheduledAt: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Notes</label>
                <input value={svcForm.notes} onChange={(e) => setSvcForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
              </div>
              {providers.length === 0 && <p className="text-[11px] text-amber-600">Tip: add Vendors/Port Authorities under <strong>Partners</strong> to pick a provider.</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setSvcModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={submitService} disabled={!svcForm.voyageId} className="px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] disabled:opacity-50 text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"><Plus className="h-3.5 w-3.5" /> Book</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
