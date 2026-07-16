import React, { useState } from 'react';
import { Vessel, Voyage, Task, User } from '@/types';
import { motion } from 'motion/react';
import { Calendar, Ship, Anchor, Clock, AlertTriangle, Users } from 'lucide-react';

interface PlanningCenterViewProps {
  vessels: Vessel[];
  voyages: Voyage[];
  tasks: Task[];
  users: User[];
}

const TAB_LABELS: Record<'schedule' | 'berth' | 'services' | 'resources' | 'calendar', string> = {
  schedule: 'Timeline',
  berth: 'Port Assignment',
  services: 'Services',
  resources: 'Resources',
  calendar: 'Calendar'
};

export default function PlanningCenterView({ vessels, voyages, tasks, users }: PlanningCenterViewProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'berth' | 'services' | 'resources' | 'calendar'>('schedule');

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
        {(['schedule', 'berth', 'services', 'resources', 'calendar'] as const).map((tab) => (
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
            {tab === 'services' && <Ship className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
            {tab === 'resources' && <Users className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Ship className="w-5 h-5 mr-2 text-[#6C4CE1]" />
                Service Planner
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.slice(0, 10).map(task => (
                  <div key={task.id} className="p-4 border border-slate-200 rounded-xl hover:border-[#6C4CE1] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 text-sm">{task.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'Delayed' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">{task.description}</div>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600">Voyage: {task.voyageNumber}</span>
                      <span className="text-[#6C4CE1] bg-[#F2EFFF] px-2 py-1 rounded-lg">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#6C4CE1]" />
                Resource Assignment
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Staff Member</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Assigned Vessels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const userVessels = vessels.filter(v => v.assignedPortAgentId === user.id);
                      return (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800 text-sm">{user.name}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{user.role.replace('_', ' ')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              user.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                              user.status === 'Busy' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {user.status || 'Available'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                            {userVessels.length > 0 ? userVessels.map(v => v.vesselName).join(', ') : 'None'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#6C4CE1]" />
                Calendar
              </h3>
              {(() => {
                type CalEntry = { date: string; label: string; kind: 'voyage' | 'task' };
                const entries: CalEntry[] = [
                  ...voyages.filter(v => v.eta).map(v => ({ date: v.eta, label: `${v.vesselName} arrives — ${v.voyageNumber}`, kind: 'voyage' as const })),
                  ...tasks.filter(t => t.dueDate).map(t => ({ date: t.dueDate, label: `${t.title} (Voyage ${t.voyageNumber})`, kind: 'task' as const }))
                ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                const groups = entries.reduce((acc: Record<string, CalEntry[]>, e) => {
                  const day = new Date(e.date).toDateString();
                  acc[day] = acc[day] || [];
                  acc[day].push(e);
                  return acc;
                }, {});
                const days = Object.keys(groups);

                if (days.length === 0) {
                  return <div className="text-center py-10 text-slate-500 font-medium">No scheduled voyages or tasks.</div>;
                }

                return (
                  <div className="space-y-4">
                    {days.map(day => (
                      <div key={day} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">{new Date(day).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        <div className="divide-y divide-slate-100">
                          {groups[day].map((e, idx) => (
                            <div key={idx} className="px-4 py-2.5 flex items-center gap-2 text-xs">
                              {e.kind === 'voyage' ? <Ship className="w-3.5 h-3.5 text-[#6C4CE1] shrink-0" /> : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              <span className="text-slate-700">{e.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}
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
    </div>
  );
}
