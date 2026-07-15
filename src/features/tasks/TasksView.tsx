import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  User, 
  Anchor, 
  Calendar, 
  Filter, 
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Play,
  Zap
} from 'lucide-react';
import { Task, Voyage, UserRole, TaskStatus, TaskCategory } from '@/types';

interface TasksViewProps {
  tasks: Task[];
  voyages: Voyage[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  userRole: UserRole;
}

export default function TasksView({ tasks, voyages, onAddTask, onUpdateTaskStatus, userRole }: TasksViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [voyageId, setVoyageId] = useState('');
  const [assignedRole, setAssignedRole] = useState<UserRole>('PORT_AGENT');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Marine');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || task.assignedTo === roleFilter;
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Helper template schedules to make coordination instant
  const quickTemplates = [
    { title: 'Pilotage Reservation Service', desc: 'Arrange incoming pilot to navigate vessel from Nab tower station.', role: 'PORT_AGENT' as UserRole, category: 'Marine' as TaskCategory },
    { title: 'Tug Boats Reservation Request', desc: 'Book three harbor tug assists for mooring operations.', role: 'PORT_AGENT' as UserRole, category: 'Marine' as TaskCategory },
    { title: 'Waste Disposal & Sludge collection', desc: 'Schedule waste disposal barge alongside vessel during cargo operations.', role: 'PORT_AGENT' as UserRole, category: 'Marine' as TaskCategory },
    { title: 'Crew Private Taxi Transport', desc: 'Book airport private terminal taxi shuttle for relief captain.', role: 'SHIP_AGENT' as UserRole, category: 'Crew' as TaskCategory },
    { title: 'Bunkering Fuel Delivery Coordination', desc: 'Coordinate safe bunker fuel delivery barge at berth.', role: 'PORT_AGENT' as UserRole, category: 'Marine' as TaskCategory },
    { title: 'Regulatory Compliance Checklist Review', desc: 'Execute standard ISPS and UK customs safety compliance reviews.', role: 'PROTECTIVE_AGENT' as UserRole, category: 'Authorities' as TaskCategory },
  ];

  const applyTemplate = (tpl: typeof quickTemplates[0]) => {
    setTitle(tpl.title);
    setDesc(tpl.desc);
    setAssignedRole(tpl.role);
    setCategory(tpl.category);
    if (voyages.length > 0) {
      setVoyageId(voyages[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !voyageId) return;

    const vNode = voyages.find(v => v.id === voyageId);
    const vNum = vNode ? vNode.voyageNumber : 'TBA';

    onAddTask({
      voyageId,
      voyageNumber: vNum,
      title,
      description: desc,
      assignedTo: assignedRole,
      status: 'Pending',
      dueDate: dueDate || new Date().toISOString().substring(0, 16),
      category
    });

    // Reset
    setTitle('');
    setDesc('');
    setVoyageId('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Actions */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        
        {/* Searches & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="All">All Assignees</option>
              <option value="PORT_AGENT">Port Agents Only</option>
              <option value="SHIP_AGENT">Ship Agents Only</option>
              <option value="PROTECTIVE_AGENT">Protective Agents Only</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>

        {/* Create Task Button */}
        {(userRole !== 'PROTECTIVE_AGENT') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-150 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Port / Vessel Service</span>
          </button>
        )}
      </div>

      {/* Collaborative Operations Note */}
      <div className="bg-slate-50 border border-slate-250/70 rounded-xl px-4 py-3 text-slate-600 text-xs flex items-start space-x-3 shadow-xs">
        <span className="text-sm shrink-0">🤝</span>
        <div>
          <span className="font-bold text-slate-800">Collaborative Dispatch Workspace:</span> This task board is fully cooperative. Any agent (Port, Ship, or Protective) is authorized to update, schedule, or close tasks across all roles to ensure zero port delays and seamless dispatch flow.
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 p-12 text-center text-slate-400 rounded-xl">
            No active port service schedules or coordination tasks found.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const roleBadgeStyles: Record<UserRole, string> = {
              PORT_AGENT: 'bg-[#6C4CE1]/10 text-[#2D1B69] border-[#6C4CE1]/20',
              SHIP_AGENT: 'bg-[#6C4CE1]/10 text-[#2D1B69] border-[#6C4CE1]/20',
              PROTECTIVE_AGENT: 'bg-purple-50 text-purple-700 border-purple-100',
              ADMIN: 'bg-slate-100 text-slate-700 border-slate-200'
            };

            const statusStyles: Record<TaskStatus, string> = {
              Pending: 'bg-slate-50 border-slate-200 text-slate-600',
              'In Progress': 'bg-amber-50 border-amber-200 text-amber-700',
              Completed: 'bg-emerald-50 border-emerald-200 text-emerald-800',
              Delayed: 'bg-rose-50 border-rose-200 text-rose-700'
            };

            return (
              <div 
                key={task.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between w-full">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${roleBadgeStyles[task.assignedTo as UserRole] || 'bg-slate-50'}`}>
                      {task.assignedTo.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${statusStyles[task.status]}`}>
                      {task.status}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-sm leading-tight">{task.title}</h5>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{task.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Anchor className="h-3.5 w-3.5 text-slate-300" />
                      <span>Voyage: <span className="font-bold text-slate-700">{task.voyageNumber}</span></span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                      <span>Due: {task.dueDate.replace('T', ' ')}</span>
                    </span>
                  </div>

                  {/* Operational controls */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {task.status === 'Completed' ? 'Operations Clear' : 'Actions:'}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {task.status !== 'Completed' && (
                        <>
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, 'In Progress')}
                            className={`p-1.5 rounded-lg border text-xs font-semibold ${
                              task.status === 'In Progress' 
                                ? 'bg-amber-500 text-white border-amber-500' 
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                            title="Set In Progress"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, 'Delayed')}
                            className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 p-1.5 rounded-lg text-xs font-semibold"
                            title="Flag Operational Delay"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      
                      {task.status !== 'Completed' ? (
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'Completed')}
                          className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>Close Task</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold font-mono">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Closed Log</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-[#6C4CE1]" />
                <span>Schedule Port Service or Coordination task</span>
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs">
              
              {/* Quick Templates Picker */}
              <div className="p-5 space-y-4 md:col-span-1 bg-slate-50/60">
                <h5 className="font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 text-[10px]">
                  <Zap className="h-3.5 w-3.5 text-[#6C4CE1]" />
                  <span>Maritime Templates</span>
                </h5>
                <p className="text-[11px] text-slate-400">Click to instantly populate standard port agency coordination items:</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {quickTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200/60 bg-white hover:border-[#6C4CE1] transition-colors text-[11px] cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 block line-clamp-1">{tpl.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{tpl.role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Schedule Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 md:col-span-2">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Associate with Active Voyage *</label>
                  <select
                    value={voyageId}
                    onChange={(e) => setVoyageId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Voyage --</option>
                    {voyages.map(voy => (
                      <option key={voy.id} value={voy.id}>
                        {voy.vesselName} ({voy.voyageNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule Fuel Oil Bunkering Delivery"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Detailed Instructions</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Specify target berths, contact details, quantity required, or agency guidelines..."
                    className="w-full border border-slate-200 rounded-lg p-2 h-20 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold">Operational Assignee</label>
                    <select
                      value={assignedRole}
                      onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                    >
                      <option value="PORT_AGENT">Port Agent (Port Services)</option>
                      <option value="SHIP_AGENT">Ship Agent (Cargo / Crew)</option>
                      <option value="PROTECTIVE_AGENT">Protective Agent (Owner protection)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold">Checklist Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TaskCategory)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                    >
                      <option value="Documentation">Documentation</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Marine">Marine</option>
                      <option value="Crew">Crew</option>
                      <option value="Authorities">Authorities</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Operational Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none font-mono bg-white"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer"
                  >
                    Schedule Service
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
