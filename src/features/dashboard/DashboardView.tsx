import React, { useMemo, useState } from 'react';
import { Plus, Ship, FileText, ChevronDown } from 'lucide-react';
import {
  UserRole,
  Vessel,
  Voyage,
  Task,
  Expense,
  Incident,
  User,
  LaytimeCalculation,
  Invoice,
  Partner,
  CrewMember,
  AuditLog,
  Notification,
} from '@/types';
import { computeCommandKpis } from './kpis';
import { computeRuleFindings } from './aiRulesEngine';
import { computeFinance, computeHealth } from './commandData';
import { deriveWeather } from './weather';
import OperationsStatusBar from './OperationsStatusBar';
import PlanningTimelineHero from './PlanningTimelineHero';
import TodaysOperations from './TodaysOperations';
import FinancialSnapshot from './FinancialSnapshot';
import BottomAnalytics from './BottomAnalytics';
import OperationalAlerts from './AiOperationsAssistant';
import ApprovalsWidget from './ApprovalsWidget';
import { NotificationsWidget } from './rightWidgets';

interface DashboardViewProps {
  userRole: UserRole;
  userName: string;
  currentUserId?: string;
  vessels: Vessel[];
  voyages: Voyage[];
  tasks: Task[];
  expenses: Expense[];
  incidents: Incident[];
  users?: User[];
  laytimeCalculations?: LaytimeCalculation[];
  invoices?: Invoice[];
  partners?: Partner[];
  crewMembers?: CrewMember[];
  auditLogs?: AuditLog[];
  notifications?: Notification[];
  onCompleteTask: (taskId: string) => void;
  onApproveExpense: (expenseId: string) => void;
  onRejectExpense: (expenseId: string) => void;
  onCreateIncident: (desc: string, severity: 'Low' | 'Medium' | 'High' | 'Critical', voyageId: string) => void;
  onMarkAllNotificationsRead?: () => void;
  setView: (view: string) => void;
}

export default function DashboardView({
  userRole,
  userName,
  currentUserId,
  vessels,
  voyages,
  tasks,
  expenses,
  incidents,
  users = [],
  laytimeCalculations = [],
  invoices = [],
  partners = [],
  notifications = [],
  onApproveExpense,
  onRejectExpense,
  onMarkAllNotificationsRead = () => {},
  setView,
}: DashboardViewProps) {
  const [showMore, setShowMore] = useState(false);

  const kpis = useMemo(
    () => computeCommandKpis({ vessels, voyages, tasks, expenses, laytimeCalculations }),
    [vessels, voyages, tasks, expenses, laytimeCalculations]
  );
  const findings = useMemo(
    () => computeRuleFindings({ laytimeCalculations, expenses, incidents, voyages, tasks }),
    [laytimeCalculations, expenses, incidents, voyages, tasks]
  );
  const finance = useMemo(() => computeFinance(invoices, expenses), [invoices, expenses]);
  const health = useMemo(
    () => computeHealth({ incidents, tasks, invoices, demurrageExceeded: kpis.demurrageExceededCount }),
    [incidents, tasks, invoices, kpis.demurrageExceededCount]
  );

  const weatherPort = useMemo(() => {
    const berthed = vessels.find((v) => v.status === 'Berthed' || v.status === 'Cargo Operations');
    if (berthed?.currentPort && berthed.currentPort !== 'At Sea') return berthed.currentPort;
    const anyPort = vessels.find((v) => v.currentPort && v.currentPort !== 'At Sea');
    return anyPort?.currentPort || 'Port Operations';
  }, [vessels]);
  const weather = useMemo(() => deriveWeather(weatherPort), [weatherPort]);

  const openIncidents = incidents.filter((i) => i.status !== 'Resolved');
  const firstName = userName.split(' ')[0];
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();
  const dateLine = new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const moreActions = useMemo(() => {
    const a: { label: string; view: string }[] = [{ label: 'Submit Expense', view: 'expenses' }];
    if (userRole === 'SHIP_AGENT' || userRole === 'ADMIN') a.push({ label: 'Laytime Ledger', view: 'laytime' });
    if (userRole === 'ADMIN') a.push({ label: 'Users & Roles', view: 'admin' });
    a.push({ label: 'Reports & Analytics', view: 'reports' });
    a.push({ label: 'Agency Settings', view: 'settings' });
    return a;
  }, [userRole]);

  return (
    <div className="space-y-5">
      {/* KPI strip / live operational status */}
      <OperationsStatusBar
        activePortCalls={kpis.activePortCallsCount}
        shipsAtBerth={kpis.shipsAtBerth}
        arrivalsToday={kpis.expectedArrivals}
        departuresToday={kpis.expectedDepartures}
        pilotRequests={kpis.pilotPendingCount}
        laytimeRunning={kpis.laytimeRunningCount}
        openIncidents={openIncidents.length}
        weather={weather}
        health={health}
        setView={setView}
      />

      {/* Compact greeting — one primary action, rest secondary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {greeting}, {firstName}
            <span aria-hidden className="ml-1.5">👋</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{dateLine} · Here's your live operational picture.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('voyages')} className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> New Port Call
          </button>
          <button onClick={() => setView('vessels')} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
            <Ship className="h-3.5 w-3.5 text-slate-400" /> Register Vessel
          </button>
          <button onClick={() => setView('documents')} className="hidden md:flex bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors items-center gap-1.5 cursor-pointer">
            <FileText className="h-3.5 w-3.5 text-slate-400" /> Upload Document
          </button>
          <div className="relative">
            <button onClick={() => setShowMore(!showMore)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
              More <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {moreActions.map((a) => (
                    <button key={a.label} onClick={() => { setView(a.view); setShowMore(false); }} className="w-full text-left px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Planning Timeline — the operational hero */}
      <PlanningTimelineHero voyages={voyages} vessels={vessels} setView={setView} />

      {/* Split: operations board | contextual right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <TodaysOperations
            voyages={voyages}
            vessels={vessels}
            users={users}
            invoices={invoices}
            laytimeCalculations={laytimeCalculations}
            expenses={expenses}
            currentUserId={currentUserId}
            setView={setView}
          />
        </div>
        <div className="space-y-5">
          <OperationalAlerts findings={findings} setView={setView} />
          <ApprovalsWidget expenses={expenses} onApprove={onApproveExpense} onReject={onRejectExpense} setView={setView} />
          <NotificationsWidget notifications={notifications} onMarkAllRead={onMarkAllNotificationsRead} setView={setView} />
        </div>
      </div>

      {/* Finance (Operations → Finance → Reports priority) */}
      <FinancialSnapshot finance={finance} setView={setView} />

      {/* Executive analytics */}
      <BottomAnalytics
        voyages={voyages}
        vessels={vessels}
        invoices={invoices}
        laytimeCalculations={laytimeCalculations}
        partners={partners}
        users={users}
        tasks={tasks}
        setView={setView}
      />
    </div>
  );
}
