import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Db } from '@/lib/db/db';
import { Auth } from '@/lib/supabase/auth';
import {
  User,
  Vessel,
  Voyage,
  Task,
  Document,
  Expense,
  Message,
  Notification,
  Incident,
  AuditLog,
  LaytimeCalculation,
  UserRole,
  VesselStatus,
  TaskStatus,
  ROLE_ALLOWED_VIEWS
} from '@/types';
import { computeCommandKpis } from '@/features/dashboard/kpis';
import { computeRuleFindings } from '@/features/dashboard/aiRulesEngine';

// Component imports
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardView from '@/features/dashboard/DashboardView';
import PlanningCenterView from '@/features/planning/PlanningCenterView';
import VesselsView from '@/features/vessels/VesselsView';
import VoyagesView from '@/features/voyages/VoyagesView';
import TasksView from '@/features/tasks/TasksView';
import DocumentsView from '@/features/documents/DocumentsView';
import ExpensesView from '@/features/expenses/ExpensesView';
import MessagesView from '@/features/messages/MessagesView';
import ReportsView from '@/features/reports/ReportsView';
import NotificationsView from '@/features/notifications/NotificationsView';
import SettingsView from '@/features/settings/SettingsView';
import AdminView from '@/features/admin/AdminView';
import AuthView from '@/features/auth/AuthView';
import LandingView from '@/features/auth/LandingView';
import LaytimeCalculatorView from '@/features/laytime/LaytimeCalculatorView';
import CrmView from '@/features/crm/CrmView';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();

  // States
  const [users, setUsers] = useState<User[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [laytimeCalculations, setLaytimeCalculations] = useState<LaytimeCalculation[]>([]);
  const [orgName, setOrgName] = useState('');

  const clearWorkspaceData = () => {
    setUsers([]);
    setVessels([]);
    setVoyages([]);
    setTasks([]);
    setDocuments([]);
    setExpenses([]);
    setMessages([]);
    setNotifications([]);
    setIncidents([]);
    setAuditLogs([]);
    setLaytimeCalculations([]);
    setOrgName('');
  };

  const loadWorkspaceData = useCallback(async () => {
    const [
      usersData, vesselsData, voyagesData, tasksData, documentsData,
      expensesData, messagesData, notificationsData, incidentsData, auditLogsData,
      laytimeCalculationsData, org
    ] = await Promise.all([
      Db.getUsers(), Db.getVessels(), Db.getVoyages(), Db.getTasks(), Db.getDocuments(),
      Db.getExpenses(), Db.getMessages(), Db.getNotifications(), Db.getIncidents(), Db.getAuditLogs(),
      Db.getLaytimeCalculations(), Db.getOrg()
    ]);
    setUsers(usersData);
    setVessels(vesselsData);
    setVoyages(voyagesData);
    setTasks(tasksData);
    setDocuments(documentsData);
    setExpenses(expensesData);
    setMessages(messagesData);
    setNotifications(notificationsData);
    setIncidents(incidentsData);
    setAuditLogs(auditLogsData);
    setLaytimeCalculations(laytimeCalculationsData);
    setOrgName(org.companyName);
  }, []);

  // Restore session on load, and keep currentUser in sync with auth state.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const user = await Auth.getSessionUser();
        if (!active) return;
        if (user) {
          setCurrentUser(user);
          await loadWorkspaceData();
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (active) setAuthChecked(true);
      }
    })();

    const unsubscribe = Auth.onAuthStateChange((session) => {
      if (!session) {
        setCurrentUser(null);
        clearWorkspaceData();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadWorkspaceData]);

  // Laytime calculations are edited independently inside the Laytime Ledger
  // (LaytimeCalculatorView owns its own fetch), so refresh this copy whenever
  // the user returns to the dashboard, to keep the KPIs/AI panel current.
  useEffect(() => {
    if (!currentUser || currentView !== 'dashboard') return;
    Db.getLaytimeCalculations().then(setLaytimeCalculations).catch(err => console.error('Failed to refresh laytime calculations:', err));
  }, [currentView, currentUser]);

  const opsSummary = useMemo(() => {
    if (!currentUser) return undefined;
    const kpis = computeCommandKpis({ vessels, voyages, tasks, expenses, laytimeCalculations });
    const findings = computeRuleFindings({ laytimeCalculations, expenses, incidents, voyages, tasks });
    const status: 'green' | 'amber' | 'red' = findings.some(f => f.severity === 'critical')
      ? 'red'
      : findings.some(f => f.severity === 'warning')
      ? 'amber'
      : 'green';
    return {
      shipsAtBerth: kpis.shipsAtBerth,
      criticalAlerts: findings.filter(f => f.severity === 'critical').length,
      status,
    };
  }, [currentUser, vessels, voyages, tasks, expenses, incidents, laytimeCalculations]);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    await loadWorkspaceData();
    const log = await Db.addAuditLog(user.id, user.name, 'Gateway Session Authenticated', `Successfully authenticated into the centralized database with role ${user.role}.`);
    setAuditLogs(prev => [log, ...prev]);
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await Db.addAuditLog(currentUser.id, currentUser.name, 'User Logout', 'Operator session terminated and listeners cleared.');
      } catch (err) {
        console.error('Failed to record logout audit log:', err);
      }
    }
    await Auth.signOut();
    setCurrentUser(null);
    clearWorkspaceData();
  };

  const handleAddVessel = async (newVessel: Omit<Vessel, 'id'>) => {
    if (!currentUser) return;
    const item = await Db.addVessel(newVessel);
    setVessels(prev => [...prev, item]);
    const log = await Db.addAuditLog(currentUser.id, currentUser.name, 'Vessel Registered', `Created vessel record ${newVessel.vesselName} (IMO ${newVessel.imoNumber}).`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleEditVessel = async (updatedVessel: Vessel) => {
    if (!currentUser) return;
    const updated = await Db.updateVessel(updatedVessel);
    setVessels(prev => prev.map(v => v.id === updated.id ? updated : v));
    const log = await Db.addAuditLog(currentUser.id, currentUser.name, 'Vessel Details Modified', `Modified vessel record for ${updatedVessel.vesselName}.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleDeleteVessel = async (id: string) => {
    if (!currentUser) return;
    await Db.deleteVessel(id);
    setVessels(prev => prev.filter(v => v.id !== id));
  };

  const handleUpdateVesselStatus = async (id: string, status: VesselStatus) => {
    if (!currentUser) return;
    const updated = await Db.updateVesselStatus(id, status);
    setVessels(prev => prev.map(v => v.id === id ? updated : v));
  };

  const handleAddVoyage = async (newVoyage: Omit<Voyage, 'id'>) => {
    if (!currentUser) return;
    const item = await Db.addVoyage(newVoyage);
    setVoyages(prev => [...prev, item]);
  };

  const handleUpdateCargoDetails = async (id: string, updates: Partial<Voyage>) => {
    if (!currentUser) return;
    const updated = await Db.updateVoyage(id, updates);
    setVoyages(prev => prev.map(v => v.id === id ? updated : v));
  };

  const handleToggleTimelineEvent = async (voyageId: string, eventIndex: number) => {
    if (!currentUser) return;
    const voyage = voyages.find(v => v.id === voyageId);
    if (!voyage) return;
    const timeline = [...voyage.timeline];
    timeline[eventIndex] = { ...timeline[eventIndex], completed: !timeline[eventIndex].completed, timestamp: new Date().toISOString() };
    const updated = await Db.updateVoyage(voyageId, { timeline });
    setVoyages(prev => prev.map(v => v.id === voyageId ? updated : v));
  };

  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    if (!currentUser) return;
    const item = await Db.addTask(newTask);
    setTasks(prev => [...prev, item]);
  };

  const handleUpdateTaskStatus = async (id: string, status: TaskStatus) => {
    if (!currentUser) return;
    const updated = await Db.updateTaskStatus(id, status);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const handleCompleteTask = (taskId: string) => {
    handleUpdateTaskStatus(taskId, 'Completed');
  };

  const handleUploadDocument = async (newDoc: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt' | 'version'>) => {
    if (!currentUser) return;
    const item = await Db.addDocument(newDoc, currentUser.name);
    setDocuments(prev => [...prev, item]);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!currentUser) return;
    await Db.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleAddExpense = async (newExpense: Omit<Expense, 'id' | 'submittedBy' | 'submittedAt'>) => {
    if (!currentUser) return;
    const item = await Db.addExpense(newExpense, currentUser.name);
    setExpenses(prev => [...prev, item]);
  };

  const handleApproveExpense = async (id: string) => {
    if (!currentUser) return;
    const updated = await Db.updateExpenseStatus(id, 'Approved');
    setExpenses(prev => prev.map(e => e.id === id ? updated : e));
  };

  const handleRejectExpense = async (id: string) => {
    if (!currentUser) return;
    const updated = await Db.updateExpenseStatus(id, 'Rejected');
    setExpenses(prev => prev.map(e => e.id === id ? updated : e));
  };

  const handleSendMessage = async (voyageId: string, content: string) => {
    if (!currentUser) return;
    const item = await Db.addMessage({ voyageId, senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, content, timestamp: new Date().toISOString() });
    setMessages(prev => [...prev, item]);
  };

  const handleCreateIncident = async (description: string, severity: 'Low' | 'Medium' | 'High' | 'Critical', voyageId: string) => {
    if (!currentUser) return;
    const item = await Db.addIncident({ voyageId, voyageNumber: 'N/A', description, severity, status: 'Open', createdAt: new Date().toISOString(), reportedBy: currentUser.name });
    setIncidents(prev => [item, ...prev]);
  };

  const handleUpdateProfile = async (name: string, email: string) => {
    if (!currentUser) return;
    const updated = await Db.updateProfile(currentUser.id, { name, email });
    setCurrentUser(updated);
  };

  const handleUpdateOrg = async (companyName: string) => {
    if (!currentUser) return;
    const org = await Db.setOrg({ id: 'org-1', companyName });
    setOrgName(org.companyName);
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    if (!currentUser) return;
    const updated = await Db.updateUserRole(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
  };

  const handleMarkNotificationRead = async (id: string) => {
    const updated = await Db.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? updated : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    await Db.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' as const })));
  };

  const handleAddNotification = async (userId: string, message: string, type: Notification['type']) => {
    const item = await Db.addNotification(userId, message, type);
    setNotifications(prev => [item, ...prev]);
  };

  const handleAddAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    const log = await Db.addAuditLog(currentUser.id, currentUser.name, action, details);
    setAuditLogs(prev => [log, ...prev]);
  };

  const renderMainView = () => {
    if (!currentUser) return null;

    const allowed = ROLE_ALLOWED_VIEWS[currentUser.role] || [];
    if (!allowed.includes(currentView)) {
      return (
        <DashboardView
          userRole={currentUser.role}
          userName={currentUser.name}
          vessels={vessels}
          voyages={voyages}
          tasks={tasks}
          expenses={expenses}
          incidents={incidents}
          auditLogs={auditLogs}
          users={users}
          laytimeCalculations={laytimeCalculations}
          onCompleteTask={handleCompleteTask}
          onApproveExpense={handleApproveExpense}
          onRejectExpense={handleRejectExpense}
          onCreateIncident={handleCreateIncident}
          setView={setView}
        />
      );
    }

    switch (currentView) {
      case 'planning': return <PlanningCenterView vessels={vessels} voyages={voyages} tasks={tasks} users={users} />;
      case 'dashboard': return <DashboardView userRole={currentUser.role} userName={currentUser.name} vessels={vessels} voyages={voyages} tasks={tasks} expenses={expenses} incidents={incidents} auditLogs={auditLogs} users={users} laytimeCalculations={laytimeCalculations} onCompleteTask={handleCompleteTask} onApproveExpense={handleApproveExpense} onRejectExpense={handleRejectExpense} onCreateIncident={handleCreateIncident} setView={setView} />;
      case 'vessels': return <VesselsView vessels={vessels} users={users} onAddVessel={handleAddVessel} onEditVessel={handleEditVessel} onDeleteVessel={handleDeleteVessel} onUpdateVesselStatus={handleUpdateVesselStatus} userRole={currentUser.role} />;
      case 'voyages': return <VoyagesView voyages={voyages} vessels={vessels} onAddVoyage={handleAddVoyage} onUpdateCargoDetails={handleUpdateCargoDetails} onToggleTimelineEvent={handleToggleTimelineEvent} userRole={currentUser.role} />;
      case 'tasks': return <TasksView tasks={tasks} voyages={voyages} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} userRole={currentUser.role} />;
      case 'documents': return <DocumentsView documents={documents} voyages={voyages} onUploadDocument={handleUploadDocument} onDeleteDocument={handleDeleteDocument} userName={currentUser.name} />;
      case 'expenses': return <ExpensesView expenses={expenses} voyages={voyages} documents={documents} onUploadDocument={handleUploadDocument} onDeleteDocument={handleDeleteDocument} onAddExpense={handleAddExpense} onApproveExpense={handleApproveExpense} onRejectExpense={handleRejectExpense} userRole={currentUser.role} userName={currentUser.name} />;
      case 'messages': return <MessagesView messages={messages} voyages={voyages} onSendMessage={handleSendMessage} userRole={currentUser.role} userName={currentUser.name} />;
      case 'crm': return <CrmView users={users} vessels={vessels} currentUser={currentUser} onSendMessage={handleSendMessage} onUpdateVessel={handleEditVessel} onAddNotification={handleAddNotification} onAddAuditLog={handleAddAuditLog} />;
      case 'reports': return <ReportsView vessels={vessels} voyages={voyages} incidents={incidents} expenses={expenses} />;
      case 'laytime': return <LaytimeCalculatorView currentUser={currentUser} />;
      case 'notifications': return <NotificationsView notifications={notifications} onMarkRead={handleMarkNotificationRead} onClearAll={handleMarkAllNotificationsRead} userRole={currentUser.role} />;
      case 'settings': return <SettingsView userName={currentUser.name} userEmail={currentUser.email} userRole={currentUser.role} org={{ id: 'org-1', companyName: orgName }} onUpdateProfile={handleUpdateProfile} onUpdateOrg={handleUpdateOrg} />;
      case 'admin': return <AdminView users={users} auditLogs={auditLogs} onUpdateUserRole={handleUpdateUserRole} />;
      default: return <div className="p-8 text-center text-slate-500 text-xs">Operational module "{currentView}" under system maintenance.</div>;
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F7F9] text-slate-400 text-xs font-sans">
        Loading workspace...
      </div>
    );
  }

  if (!currentUser) {
    if (showAuth) {
      return <AuthView onLoginSuccess={handleLoginSuccess} onBack={() => setShowAuth(false)} initialRole={selectedRole} />;
    }
    return <LandingView onLoginClick={(role) => { setSelectedRole(role); setShowAuth(true); }} />;
  }

  return (
    <div className="flex bg-[#F4F7F9] min-h-screen text-slate-800 antialiased font-sans relative">
      <Sidebar currentView={currentView} setView={setView} userRole={currentUser.role} userName={currentUser.name} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentView={currentView} userRole={currentUser.role} notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} orgName={orgName} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} opsSummary={opsSummary} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderMainView()}
        </main>
      </div>
    </div>
  );
}
