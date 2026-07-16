import React, { useMemo, useState } from 'react';
import {
  Ship,
  Compass,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  Check,
  X,
  TrendingUp,
  Sliders,
  Sparkles,
  Plus,
  Clock,
  ChevronRight,
  ChevronDown,
  CalendarCheck,
  BarChart2,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import {
  UserRole,
  Vessel,
  Voyage,
  Task,
  Expense,
  Incident,
  User,
  LaytimeCalculation
} from '@/types';
import { computeCommandKpis } from './kpis';
import { computeRuleFindings } from './aiRulesEngine';
import OperationalAlerts from './AiOperationsAssistant';
import TodaysPortCalls from './TodaysPortCalls';
import PortCallsByStatus from './PortCallsByStatus';
import OperationsChecklist from './OperationsChecklist';
import IncidentCentre from './IncidentCentre';
import OperationsStatusBar from './OperationsStatusBar';
import TasksOverviewChart from './TasksOverviewChart';
import PlanningPreview from './PlanningPreview';

interface DashboardViewProps {
  userRole: UserRole;
  userName: string;
  vessels: Vessel[];
  voyages: Voyage[];
  tasks: Task[];
  expenses: Expense[];
  incidents: Incident[];
  users?: User[];
  laytimeCalculations?: LaytimeCalculation[];
  onCompleteTask: (taskId: string) => void;
  onApproveExpense: (expenseId: string) => void;
  onRejectExpense: (expenseId: string) => void;
  onCreateIncident: (desc: string, severity: 'Low' | 'Medium' | 'High' | 'Critical', voyageId: string) => void;
  setView: (view: string) => void;
}

interface KpiCard {
  label: string;
  val: number | string;
  footer: string;
  icon: typeof Ship;
  color: string;
}

export default function DashboardView({
  userRole,
  userName,
  vessels,
  voyages,
  tasks,
  expenses,
  incidents,
  users = [],
  laytimeCalculations = [],
  onCompleteTask,
  onApproveExpense,
  onRejectExpense,
  onCreateIncident,
  setView
}: DashboardViewProps) {
  const [dashboardViewMode, setDashboardViewMode] = useState<'workspace' | 'analytics'>('workspace');
  const [taskViewFilter, setTaskViewFilter] = useState<'mine' | 'all'>('mine');

  // Compile Analytics Data (unchanged — already real-data derived)
  const costComparisonData = voyages.map(voy => {
    const voyExpenses = expenses.filter(e => e.voyageId === voy.id);
    const estTotal = voyExpenses.reduce((sum, e) => sum + e.estimatedAmount, 0);
    const actTotal = voyExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      name: voy.voyageNumber,
      vessel: voy.vesselName,
      'PDA Est': estTotal,
      'FDA Act': actTotal,
    };
  });

  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const expenseCategoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  const statusCount: Record<string, number> = {};
  vessels.forEach(v => {
    statusCount[v.status] = (statusCount[v.status] || 0) + 1;
  });
  const vesselStatusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const COLORS = ['#6C4CE1', '#26a69a', '#00bcd4', '#03a9f4', '#3f51b5', '#673ab7', '#e91e63', '#ff5722', '#ff9800'];

  const activeVoyages = voyages.filter(v => v.status !== 'Completed');
  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && (taskViewFilter === 'all' || userRole === 'ADMIN' || t.assignedTo === userRole));
  const pendingExpenses = expenses.filter(e => e.status === 'Pending Approval');
  const openIncidents = incidents.filter(i => i.status !== 'Resolved');

  const kpis = useMemo(
    () => computeCommandKpis({ vessels, voyages, tasks, expenses, laytimeCalculations }),
    [vessels, voyages, tasks, expenses, laytimeCalculations]
  );
  const findings = useMemo(
    () => computeRuleFindings({ laytimeCalculations, expenses, incidents, voyages, tasks }),
    [laytimeCalculations, expenses, incidents, voyages, tasks]
  );
  const criticalAlertsCount = findings.filter(f => f.severity === 'critical').length;
  const demurrageRiskCount = kpis.demurrageExceededCount + kpis.demurrageNearingCount;

  const [showMoreActions, setShowMoreActions] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const firstName = userName.split(' ')[0];

  const moreActions: { label: string; view: string }[] = [];
  if (userRole === 'PORT_AGENT') moreActions.push({ label: 'Update Vessel ETA & ETD', view: 'vessels' });
  if (userRole === 'SHIP_AGENT') moreActions.push({ label: 'View Laytime Ledger', view: 'laytime' });
  if (userRole === 'ADMIN') moreActions.push({ label: 'Manage Users & Roles', view: 'admin' });
  moreActions.push({ label: 'View Intelligence Reports', view: 'reports' });
  moreActions.push({ label: 'Agency Settings', view: 'settings' });

  const kpiCards: KpiCard[] = useMemo(() => {
    switch (userRole) {
      case 'PORT_AGENT':
        return [
          { label: "Today's Port Calls", val: kpis.todaysPortCalls, footer: `${kpis.expectedArrivals} arriving today`, icon: CalendarCheck, color: 'text-[#6C4CE1] bg-[#6C4CE1]/10' },
          { label: 'Ships at Berth', val: kpis.shipsAtBerth, footer: 'Berthed or in cargo ops', icon: Ship, color: 'text-[#2D1B69] bg-[#6C4CE1]/10' },
          { label: 'Expected Arrivals', val: kpis.expectedArrivals, footer: 'No actual ETA logged yet', icon: Compass, color: 'text-amber-600 bg-amber-50' },
          { label: 'Outstanding Tasks', val: kpis.outstandingTasksCount, footer: `${kpis.overdueTasksCount} overdue`, icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
        ];
      case 'SHIP_AGENT':
        return [
          { label: 'Ships at Berth', val: kpis.shipsAtBerth, footer: 'Berthed or in cargo ops', icon: Ship, color: 'text-[#2D1B69] bg-[#6C4CE1]/10' },
          { label: 'Pending FDA', val: kpis.pendingFdaCount, footer: `$${kpis.pendingFdaAmount.toLocaleString()} pending`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Your Open Tasks', val: pendingTasks.length, footer: `${kpis.overdueTasksCount} overdue`, icon: CheckSquare, color: 'text-sky-600 bg-sky-50' },
          { label: 'Expected Departures', val: kpis.expectedDepartures, footer: 'No actual ETD logged yet', icon: Compass, color: 'text-pink-600 bg-pink-50' },
        ];
      case 'PROTECTIVE_AGENT':
        return [
          { label: 'Active Maritime Incidents', val: openIncidents.length, footer: 'Currently unresolved', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
          { label: 'Demurrage Risk', val: demurrageRiskCount, footer: `${kpis.demurrageExceededCount} exceeded · ${kpis.demurrageNearingCount} nearing`, icon: Clock, color: 'text-red-600 bg-red-50' },
          { label: 'High Cost Overruns Flagged', val: kpis.highCostOverrunsCount, footer: '>20% over PDA estimate', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
          { label: 'Critical Alerts', val: criticalAlertsCount, footer: 'From Operational Alerts', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
        ];
      case 'ADMIN':
      default:
        return [
          { label: "Today's Port Calls", val: kpis.todaysPortCalls, footer: `${kpis.expectedArrivals} arriving · ${kpis.expectedDepartures} departing`, icon: CalendarCheck, color: 'text-[#6C4CE1] bg-[#6C4CE1]/10' },
          { label: 'Pending FDA', val: `$${kpis.pendingFdaAmount.toLocaleString()}`, footer: `${kpis.pendingFdaCount} awaiting approval`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Critical Alerts', val: criticalAlertsCount, footer: 'From Operational Alerts', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
          { label: 'Outstanding Tasks', val: kpis.outstandingTasksCount, footer: `${kpis.overdueTasksCount} overdue`, icon: CheckSquare, color: 'text-[#6C4CE1] bg-[#6C4CE1]/10/70' },
        ];
    }
  }, [userRole, kpis, pendingTasks.length, openIncidents.length, demurrageRiskCount, criticalAlertsCount]);

  return (
    <div className="space-y-8 p-1">
      <OperationsStatusBar
        activePortCalls={kpis.activePortCallsCount}
        shipsAtBerth={kpis.shipsAtBerth}
        pilotPending={kpis.pilotPendingCount}
        laytimeRunning={kpis.laytimeRunningCount}
        openIncidents={openIncidents.length}
        setView={setView}
      />

      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl text-slate-900 flex items-center gap-2">
            <span>{getGreeting()}, {firstName}</span>
            <span aria-hidden>👋</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your operations today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setView('voyages')}
            className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Port Call</span>
          </button>
          <button
            onClick={() => setView('vessels')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Ship className="h-3.5 w-3.5 text-slate-400" />
            <span>Register Vessel</span>
          </button>
          <button
            onClick={() => setView('documents')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => setView('expenses')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            <span>Submit Expense</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>More Actions</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showMoreActions && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                {moreActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => { setView(action.view); setShowMoreActions(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of real operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((stat, idx) => {
          const Icon = stat.icon;
          const isZeroOrEmpty = stat.val === 0 || stat.val === '0' || stat.val === '$0';

          return (
            <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36 relative overflow-hidden group">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color} transition-transform group-hover:scale-105 duration-150`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="mt-3">
                <p className="text-4xl font-bold text-[#6C4CE1] leading-none tracking-tight">{stat.val}</p>
                <span className="text-xs text-slate-500 mt-1.5 block">{stat.label}</span>
              </div>

              <div className="pt-2.5">
                {isZeroOrEmpty ? (
                  <span className="inline-flex text-[10px] text-slate-400 font-medium">No active data</span>
                ) : (
                  <span className="inline-flex text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    {stat.footer}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Segment Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setDashboardViewMode('workspace')}
          className={`px-5 py-3 text-xs font-bold font-sans transition-all flex items-center space-x-2 border-b-2 ${
            dashboardViewMode === 'workspace'
              ? 'border-[#6C4CE1] text-[#6C4CE1]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Operations Workspace</span>
        </button>
        <button
          onClick={() => setDashboardViewMode('analytics')}
          className={`px-5 py-3 text-xs font-bold font-sans transition-all flex items-center space-x-2 border-b-2 ${
            dashboardViewMode === 'analytics'
              ? 'border-[#6C4CE1] text-[#6C4CE1]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Performance & Financial Analytics</span>
        </button>
      </div>

      {/* Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Col 1 & 2: Main Operations / Actions */}
        <div className="lg:col-span-2 space-y-6">

          {dashboardViewMode === 'workspace' ? (
            <>
              {/* Your Assigned Action Items */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 p-5 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-5 w-5 text-[#6C4CE1]" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {taskViewFilter === 'mine' ? "Your Assigned Action Items" : "Cooperative Incomplete Tasks"}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {userRole !== 'ADMIN' && (
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                        <button
                          onClick={() => setTaskViewFilter('mine')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            taskViewFilter === 'mine'
                              ? 'bg-white text-[#6C4CE1] shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          My Role
                        </button>
                        <button
                          onClick={() => setTaskViewFilter('all')}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            taskViewFilter === 'all'
                              ? 'bg-white text-[#6C4CE1] shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Collaborative Mode: View and close tasks for all roles"
                        >
                          All Agent Roles 🤝
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setView('tasks')}
                      className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <span>View Taskboard</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="p-2 divide-y divide-slate-100">
                  {pendingTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      {taskViewFilter === 'mine'
                        ? 'All clear! No pending tasks assigned to your role.'
                        : 'Awesome! No pending tasks left across any agent roles.'}
                    </div>
                  ) : (
                    pendingTasks.slice(0, 5).map((task) => {
                      const isAssignedToOther = task.assignedTo !== userRole;
                      return (
                        <div key={task.id} className="p-4 flex items-start justify-between hover:bg-slate-50/50 rounded-lg transition-colors">
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-700">{task.title}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#6C4CE1]/10 text-[#6C4CE1] font-semibold border border-[#6C4CE1]/20">
                                {task.voyageNumber}
                              </span>
                              {isAssignedToOther && (
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-250/50">
                                  Cooperative Action
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-md">{task.description}</p>
                            <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-slate-300" />
                                <span>Due: {task.dueDate.replace('T', ' ')}</span>
                              </span>
                              <span>•</span>
                              <span className={`px-1 rounded ${isAssignedToOther ? 'bg-amber-50/80 text-amber-800 font-bold' : 'text-slate-500'}`}>
                                Assignee: {task.assignedTo.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => onCompleteTask(task.id)}
                            className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 p-1.5 rounded-lg border border-emerald-200 hover:border-emerald-500 transition-all duration-150 flex items-center justify-center shrink-0 self-center cursor-pointer"
                            title={isAssignedToOther ? `Close Task on behalf of ${task.assignedTo.replace('_', ' ')}` : "Mark task as completed"}
                          >
                            <Check className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <PortCallsByStatus voyages={voyages} setView={setView} />

              <TodaysPortCalls voyages={voyages} vessels={vessels} users={users} setView={setView} />

              <PlanningPreview voyages={voyages} setView={setView} />
            </>
          ) : (
            <div className="space-y-6">

              {/* Disbursement Variance Audit (PDA Estimate vs FDA Actual) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">PDA vs FDA Voyage Disbursements</h4>
                    <p className="text-[11px] text-slate-400">Comparing estimated budget (Proforma) vs finalized expenses (Actual) by voyage ID</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-[#6C4CE1]" />
                </div>
                <div className="h-64 text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar dataKey="PDA Est" fill="#6C4CE1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="FDA Act" fill="#ff5722" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grid of secondary statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Cost Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">Disbursement Category Allocations</h4>
                    <p className="text-[11px] text-slate-400">Total verified expenses aggregated across all registered classifications</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={expenseCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {expenseCategoryData.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-slate-600 font-semibold truncate max-w-[80px]" title={item.name}>{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-800 font-bold">${item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vessel operational status */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">Vessel Registry Status Counts</h4>
                    <p className="text-[11px] text-slate-400">Active vessels distributed by their real-time operational status</p>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vesselStatusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#00bcd4" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Col 3: Sidebar Contextual Action Panels */}
        <div className="space-y-6">

          <OperationalAlerts findings={findings} setView={setView} />

          <TasksOverviewChart tasks={tasks} setView={setView} />

          {/* Expenses awaiting approval (Visible to PROTECTIVE_AGENT or ADMIN for auditing / approval) */}
          {(userRole === 'PROTECTIVE_AGENT' || userRole === 'ADMIN') && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Costs Pending Audit</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-100 text-rose-700 font-bold">
                  {pendingExpenses.length} Action
                </span>
              </div>

              <div className="p-3 divide-y divide-slate-100">
                {pendingExpenses.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No pending FDA. Commercial operations up to date.
                  </div>
                ) : (
                  pendingExpenses.map((exp) => {
                    const isOverrun = exp.amount > exp.estimatedAmount * 1.1;
                    return (
                      <div key={exp.id} className="py-3 text-xs space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">{exp.category}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Voyage: {exp.voyageNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">${exp.amount.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 font-mono">Est: ${exp.estimatedAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg leading-relaxed">
                          "{exp.description}"
                        </p>

                        {isOverrun && (
                           <div className="flex items-center space-x-1.5 text-rose-600 font-mono text-[9px] font-bold bg-rose-50 px-2 py-1 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            <span>FLAGGED: Expense is +{Math.round(((exp.amount - exp.estimatedAmount)/exp.estimatedAmount)*100)}% over PDA estimate!</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 justify-end pt-1">
                          <button
                            onClick={() => onRejectExpense(exp.id)}
                            className="bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 border border-slate-200 hover:border-rose-200 px-2 py-1 rounded text-[10px] font-semibold transition-colors flex items-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => onApproveExpense(exp.id)}
                            className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-2.5 py-1 rounded text-[10px] font-semibold shadow-sm transition-colors flex items-center space-x-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve Charge</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Compliance & Risk Widget for Port agents or ship agents */}
          {(userRole === 'PORT_AGENT' || userRole === 'SHIP_AGENT') && (
            <OperationsChecklist tasks={tasks} setView={setView} />
          )}

          <IncidentCentre
            incidents={incidents}
            voyages={voyages}
            demurrageRiskCount={demurrageRiskCount}
            onCreateIncident={onCreateIncident}
          />

        </div>

      </div>
    </div>
  );
}
