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
  Partner,
  CrewMember,
  Tariff,
  Invoice,
  InvoiceStatus,
  Organization,
  ROLE_ALLOWED_VIEWS
} from '@/types';
import { computeCommandKpis } from '@/features/dashboard/kpis';
import { computeRuleFindings } from '@/features/dashboard/aiRulesEngine';
import { loadPermissions } from '@/lib/rbac/session';
import { Permission, allowedViews, defaultPermissionsForRole, can } from '@/lib/rbac/permissions';
import { RoleKey } from '@/types';

// Component imports
import Sidebar from '@/components/layout/Sidebar';
import PlatformSidebar from '@/components/layout/PlatformSidebar';
import Header from '@/components/layout/Header';
import PlatformDashboard from '@/features/platform/PlatformDashboard';
import RolesPermissionsView from '@/features/platform/RolesPermissionsView';
import PlatformSubscriptionsView from '@/features/platform/PlatformSubscriptionsView';
import PlatformAnalyticsView from '@/features/platform/PlatformAnalyticsView';
import PlatformBillingView from '@/features/platform/PlatformBillingView';
import PlatformModulePlaceholder from '@/features/platform/PlatformModulePlaceholder';
import UsersManagementView from '@/features/platform/UsersManagementView';
import { KeyRound, Server, Database, HardDrive, CreditCard, LineChart, Flag, Gauge } from 'lucide-react';
import CommandPalette from '@/components/layout/CommandPalette';
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
import CompanySettingsView from '@/features/settings/CompanySettingsView';
import SubscriptionView from '@/features/settings/SubscriptionView';
import AdminView from '@/features/admin/AdminView';
import OrganizationsView from '@/features/admin/OrganizationsView';
import AuthView from '@/features/auth/AuthView';
import AcceptInviteView from '@/features/auth/AcceptInviteView';
import WorkspaceLockedView from '@/features/auth/WorkspaceLockedView';
import LandingView from '@/features/auth/LandingView';
import { workspaceAccess } from '@/lib/billing/plans';
import LaytimeCalculatorView from '@/features/laytime/LaytimeCalculatorView';
import CrmView from '@/features/crm/CrmView';
import CrewView from '@/features/crew/CrewView';
import PartnersView from '@/features/partners/PartnersView';
import TariffsView from '@/features/tariffs/TariffsView';
import InvoicesView from '@/features/invoices/InvoicesView';
import ApprovalsView from '@/features/approvals/ApprovalsView';

// Captured at module load, before supabase-js clears the URL hash: an invite /
// recovery link lands here so we can route the user to set their password.
const INITIAL_HASH = typeof window !== 'undefined' ? window.location.hash : '';
const IS_INVITE_LINK = /type=(invite|recovery|signup)/.test(INITIAL_HASH);

// Maps RBAC role keys onto the legacy 4-role model the operational views still
// use for action-gating. Admin-tier org roles get full edit; agents keep their
// role; Viewers get a value no legacy check matches, so they stay read-only.
function effectiveRole(role: string): UserRole {
  if (role === 'PORT_AGENT') return 'PORT_AGENT';
  if (role === 'SHIP_AGENT') return 'SHIP_AGENT';
  if (role === 'PROTECTIVE_AGENT' || role === 'SUPERVISORY_AGENT') return 'PROTECTIVE_AGENT';
  if (role === 'VIEWER') return 'VIEWER' as UserRole;
  return 'ADMIN';
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [inviteFlow, setInviteFlow] = useState(IS_INVITE_LINK);
  const [currentView, setView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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
  const [org, setOrgState] = useState<Organization>({ id: 'org-1', companyName: '' });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

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
    setOrgState({ id: 'org-1', companyName: '' });
    setPartners([]);
    setCrewMembers([]);
    setTariffs([]);
    setInvoices([]);
    setOrganizations([]);
    setPermissions(new Set());
  };

  const loadWorkspaceData = useCallback(async (activeOrgId: string = 'org-1') => {
    const [
      usersData, vesselsData, voyagesData, tasksData, documentsData,
      expensesData, messagesData, notificationsData, incidentsData, auditLogsData,
      laytimeCalculationsData, orgData, partnersData, crewMembersData, tariffsData, invoicesData,
      organizationsData
    ] = await Promise.all([
      Db.getUsers(), Db.getVessels(), Db.getVoyages(), Db.getTasks(), Db.getDocuments(),
      Db.getExpenses(), Db.getMessages(), Db.getNotifications(), Db.getIncidents(), Db.getAuditLogs(),
      Db.getLaytimeCalculations(), Db.getOrg(activeOrgId), Db.getPartners(), Db.getCrewMembers(), Db.getTariffs(), Db.getInvoices(),
      Db.getOrganizations()
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
    setOrgState(orgData);
    setPartners(partnersData);
    setCrewMembers(crewMembersData);
    setTariffs(tariffsData);
    setInvoices(invoicesData);
    setOrganizations(organizationsData);
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
          await loadWorkspaceData(user.organizationId);
          loadPermissions(user).then((p) => { if (active) setPermissions(p); }).catch(() => {});
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
    await loadWorkspaceData(user.organizationId);
    loadPermissions(user).then(setPermissions).catch(() => {});
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

  const handleAddVessel = async (newVessel: Omit<Vessel, 'id'>): Promise<Vessel> => {
    if (!currentUser) throw new Error('Not authenticated.');
    const item = await Db.addVessel(newVessel);
    setVessels(prev => [...prev, item]);
    const log = await Db.addAuditLog(currentUser.id, currentUser.name, 'Vessel Registered', `Created vessel record ${newVessel.vesselName} (IMO ${newVessel.imoNumber}).`);
    setAuditLogs(prev => [log, ...prev]);
    return item;
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

  const handleDeleteVoyage = async (id: string) => {
    if (!currentUser) return;
    await Db.deleteVoyage(id);
    // The schema cascade-deletes everything keyed to this voyage server-side
    // (tasks, documents, expenses, messages, incidents, laytime calcs) —
    // mirror that locally so the UI doesn't show orphaned rows until reload.
    setVoyages(prev => prev.filter(v => v.id !== id));
    setTasks(prev => prev.filter(t => t.voyageId !== id));
    setDocuments(prev => prev.filter(d => d.voyageId !== id));
    setExpenses(prev => prev.filter(e => e.voyageId !== id));
    setMessages(prev => prev.filter(m => m.voyageId !== id));
    setIncidents(prev => prev.filter(i => i.voyageId !== id));
    setLaytimeCalculations(prev => prev.filter(l => l.voyageId !== id));
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

  const handleUpdateOrg = async (updates: { companyName: string; address: string; licenseId: string }) => {
    if (!currentUser) return;
    // Save to the authenticated user's organization — never a hardcoded id.
    const updated = await Db.setOrg({ id: currentUser.organizationId, ...updates });
    setOrgState(updated);
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    if (!currentUser) return;
    const updated = await Db.updateUserRole(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
  };

  const handleUpdateAccountStatus = async (userId: string, status: string): Promise<void> => {
    const updated = await Db.updateAccountStatus(userId, status);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
  };

  const handleAddOrganization = async (input: { companyName: string; address?: string; licenseId?: string; plan?: string; planStatus?: string; planExpiry?: string | null; enabledModules?: string[] | null }): Promise<Organization> => {
    const item = await Db.addOrganization(input);
    setOrganizations(prev => [...prev, item]);
    return item;
  };

  const handleUpdateOrganization = async (id: string, updates: { companyName?: string; address?: string; licenseId?: string; status?: string; plan?: string; planStatus?: string; planExpiry?: string | null; enabledModules?: string[] | null }): Promise<Organization> => {
    const updated = await Db.updateOrganization(id, updates);
    setOrganizations(prev => prev.map(o => o.id === id ? updated : o));
    return updated;
  };

  const handleDeleteOrganization = async (id: string): Promise<void> => {
    await Db.deleteOrganization(id);
    setOrganizations(prev => prev.filter(o => o.id !== id));
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

  const handleAddPartner = async (partner: Omit<Partner, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const item = await Db.addPartner(partner);
    setPartners(prev => [...prev, item]);
  };

  const handleEditPartner = async (partner: Partner) => {
    if (!currentUser) return;
    const updated = await Db.updatePartner(partner);
    setPartners(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeletePartner = async (id: string) => {
    if (!currentUser) return;
    await Db.deletePartner(id);
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const handleAddCrewMember = async (crew: Omit<CrewMember, 'id'>) => {
    if (!currentUser) return;
    const item = await Db.addCrewMember(crew);
    setCrewMembers(prev => [...prev, item]);
  };

  const handleEditCrewMember = async (crew: CrewMember) => {
    if (!currentUser) return;
    const updated = await Db.updateCrewMember(crew);
    setCrewMembers(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCrewMember = async (id: string) => {
    if (!currentUser) return;
    await Db.deleteCrewMember(id);
    setCrewMembers(prev => prev.filter(c => c.id !== id));
  };

  const handleAddTariff = async (tariff: Omit<Tariff, 'id'>) => {
    if (!currentUser) return;
    const item = await Db.addTariff(tariff);
    setTariffs(prev => [...prev, item]);
  };

  const handleEditTariff = async (tariff: Tariff) => {
    if (!currentUser) return;
    const updated = await Db.updateTariff(tariff);
    setTariffs(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteTariff = async (id: string) => {
    if (!currentUser) return;
    await Db.deleteTariff(id);
    setTariffs(prev => prev.filter(t => t.id !== id));
  };

  const handleAddInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const item = await Db.addInvoice(invoice);
    setInvoices(prev => [...prev, item]);
  };

  const handleUpdateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    if (!currentUser) return;
    const updated = await Db.updateInvoiceStatus(id, status);
    setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!currentUser) return;
    await Db.deleteInvoice(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  // Falls back to the role's documented defaults until live grants load, so the
  // app never renders with an empty permission set mid-fetch.
  const effectivePermissions = useMemo<Set<Permission>>(() => {
    if (permissions.size) return permissions;
    if (currentUser) return defaultPermissionsForRole(currentUser.role as RoleKey);
    return new Set<Permission>();
  }, [permissions, currentUser]);

  const renderMainView = () => {
    if (!currentUser) return null;

    // Legacy operational views gate actions on the original 4 role names. Map the
    // RBAC roles onto them so Org Admins / Operations users can actually operate,
    // agents keep their behaviour, and Viewers stay read-only.
    const viewRole = effectiveRole(currentUser.role);

    const allowed = allowedViews(effectivePermissions);
    if (currentUser.isPlatformAdmin) allowed.push('organizations');
    if (can(effectivePermissions, 'company', 'view')) allowed.push('subscription');
    if (!allowed.includes(currentView)) {
      return (
        <DashboardView
          userRole={viewRole}
          userName={currentUser.name}
          currentUserId={currentUser.id}
          vessels={vessels}
          voyages={voyages}
          tasks={tasks}
          expenses={expenses}
          incidents={incidents}
          users={users}
          laytimeCalculations={laytimeCalculations}
          invoices={invoices}
          partners={partners}
          crewMembers={crewMembers}
          auditLogs={auditLogs}
          notifications={notifications}
          onCompleteTask={handleCompleteTask}
          onApproveExpense={handleApproveExpense}
          onRejectExpense={handleRejectExpense}
          onCreateIncident={handleCreateIncident}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          setView={setView}
        />
      );
    }

    switch (currentView) {
      case 'planning': return <PlanningCenterView vessels={vessels} voyages={voyages} tasks={tasks} users={users} />;
      case 'dashboard': return <DashboardView userRole={viewRole} userName={currentUser.name} currentUserId={currentUser.id} vessels={vessels} voyages={voyages} tasks={tasks} expenses={expenses} incidents={incidents} users={users} laytimeCalculations={laytimeCalculations} invoices={invoices} partners={partners} crewMembers={crewMembers} auditLogs={auditLogs} notifications={notifications} onCompleteTask={handleCompleteTask} onApproveExpense={handleApproveExpense} onRejectExpense={handleRejectExpense} onCreateIncident={handleCreateIncident} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} setView={setView} />;
      case 'vessels': return <VesselsView vessels={vessels} users={users} onAddVessel={handleAddVessel} onEditVessel={handleEditVessel} onDeleteVessel={handleDeleteVessel} onUpdateVesselStatus={handleUpdateVesselStatus} userRole={viewRole} />;
      case 'voyages': return <VoyagesView voyages={voyages} vessels={vessels} users={users} tasks={tasks} documents={documents} expenses={expenses} laytimeCalculations={laytimeCalculations} onAddVoyage={handleAddVoyage} onAddVessel={handleAddVessel} onUpdateCargoDetails={handleUpdateCargoDetails} onDeleteVoyage={handleDeleteVoyage} onToggleTimelineEvent={handleToggleTimelineEvent} setView={setView} userRole={viewRole} />;
      case 'tasks': return <TasksView tasks={tasks} voyages={voyages} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} userRole={viewRole} />;
      case 'documents': return <DocumentsView documents={documents} voyages={voyages} onUploadDocument={handleUploadDocument} onDeleteDocument={handleDeleteDocument} userName={currentUser.name} />;
      case 'expenses': return <ExpensesView expenses={expenses} voyages={voyages} documents={documents} onUploadDocument={handleUploadDocument} onDeleteDocument={handleDeleteDocument} onAddExpense={handleAddExpense} onApproveExpense={handleApproveExpense} onRejectExpense={handleRejectExpense} userRole={viewRole} userName={currentUser.name} />;
      case 'messages': return <MessagesView messages={messages} voyages={voyages} onSendMessage={handleSendMessage} userRole={viewRole} userName={currentUser.name} />;
      case 'crm': return <CrmView users={users} vessels={vessels} currentUser={currentUser} onSendMessage={handleSendMessage} onUpdateVessel={handleEditVessel} onAddNotification={handleAddNotification} onAddAuditLog={handleAddAuditLog} />;
      case 'crew': return <CrewView crewMembers={crewMembers} vessels={vessels} onAddCrewMember={handleAddCrewMember} onEditCrewMember={handleEditCrewMember} onDeleteCrewMember={handleDeleteCrewMember} />;
      case 'partners': return <PartnersView partners={partners} onAddPartner={handleAddPartner} onEditPartner={handleEditPartner} onDeletePartner={handleDeletePartner} />;
      case 'tariffs': return <TariffsView tariffs={tariffs} partners={partners} onAddTariff={handleAddTariff} onEditTariff={handleEditTariff} onDeleteTariff={handleDeleteTariff} />;
      case 'invoices': return <InvoicesView invoices={invoices} voyages={voyages} partners={partners} onAddInvoice={handleAddInvoice} onUpdateInvoiceStatus={handleUpdateInvoiceStatus} onDeleteInvoice={handleDeleteInvoice} userName={currentUser.name} />;
      case 'approvals': return <ApprovalsView expenses={expenses} incidents={incidents} onApproveExpense={handleApproveExpense} onRejectExpense={handleRejectExpense} userRole={currentUser.role} />;
      case 'reports': return <ReportsView vessels={vessels} voyages={voyages} incidents={incidents} expenses={expenses} />;
      case 'laytime': return <LaytimeCalculatorView currentUser={currentUser} orgName={org.companyName} />;
      case 'notifications': return <NotificationsView notifications={notifications} onMarkRead={handleMarkNotificationRead} onClearAll={handleMarkAllNotificationsRead} userRole={currentUser.role} />;
      case 'settings': return <SettingsView userName={currentUser.name} userEmail={currentUser.email} userRole={currentUser.role} onUpdateProfile={handleUpdateProfile} />;
      case 'company': return <CompanySettingsView userRole={currentUser.role} org={org} onUpdateOrg={handleUpdateOrg} />;
      case 'subscription': return <SubscriptionView org={org} userCount={users.filter(u => !u.platformRole).length} />;
      case 'organizations': return <OrganizationsView organizations={organizations} users={users} currentOrgId={currentUser.organizationId} onCreateOrganization={handleAddOrganization} onUpdateOrganization={handleUpdateOrganization} onDeleteOrganization={handleDeleteOrganization} />;
      case 'admin': return <AdminView users={users} auditLogs={auditLogs} onUpdateUserRole={handleUpdateUserRole} initialTab="users" currentUserId={currentUser.id} />;
      case 'auditlogs': return <AdminView users={users} auditLogs={auditLogs} onUpdateUserRole={handleUpdateUserRole} initialTab="auditlogs" />;
      default: return <div className="p-8 text-center text-slate-500 text-xs">Operational module "{currentView}" under system maintenance.</div>;
    }
  };

  // Platform Admin sees a completely separate console — no vessel/operations pages.
  const renderPlatformView = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'organizations':
        return <OrganizationsView organizations={organizations} users={users} currentOrgId={currentUser.organizationId} onCreateOrganization={handleAddOrganization} onUpdateOrganization={handleUpdateOrganization} onDeleteOrganization={handleDeleteOrganization} />;
      case 'platform-team':
        return <UsersManagementView scope="platform" users={users} organizations={organizations} auditLogs={auditLogs} currentUserId={currentUser.id} currentUserIsOwner={currentUser.platformRole === 'PLATFORM_OWNER'} onUpdateUserRole={handleUpdateUserRole} onUpdateAccountStatus={handleUpdateAccountStatus} onRefresh={loadWorkspaceData} />;
      case 'orgusers':
      case 'users':
        return <UsersManagementView scope="organization" users={users} organizations={organizations} auditLogs={auditLogs} currentUserId={currentUser.id} onUpdateUserRole={handleUpdateUserRole} onUpdateAccountStatus={handleUpdateAccountStatus} onRefresh={loadWorkspaceData} />;
      case 'roles':
        return <RolesPermissionsView />;
      case 'auditlogs':
        return <AdminView users={users} auditLogs={auditLogs} onUpdateUserRole={handleUpdateUserRole} initialTab="auditlogs" />;
      case 'notifications':
        return <NotificationsView notifications={notifications} onMarkRead={handleMarkNotificationRead} onClearAll={handleMarkAllNotificationsRead} userRole={currentUser.role} />;
      case 'settings':
        return <SettingsView userName={currentUser.name} userEmail={currentUser.email} userRole={currentUser.role} onUpdateProfile={handleUpdateProfile} />;
      case 'subscriptions':
        return <PlatformSubscriptionsView organizations={organizations} users={users} onUpdateOrganization={handleUpdateOrganization} />;
      case 'analytics':
        return <PlatformAnalyticsView organizations={organizations} users={users} auditLogs={auditLogs} />;
      case 'billing':
        return <PlatformBillingView organizations={organizations} setView={setView} />;
      case 'svc-auth':
        return <PlatformModulePlaceholder icon={KeyRound} title="Authentication" description="Monitor sign-ins, sessions and identity across the platform." bullets={['Sign-in activity & active sessions', 'Identity providers (email, OAuth)', 'Password & MFA policies', 'Failed-login monitoring', 'Locked / suspended accounts', 'Recent logins by organization']} note="Authentication events already flow into Audit Logs today." />;
      case 'svc-api':
        return <PlatformModulePlaceholder icon={Server} title="API & Edge Functions" description="Health and usage of the platform API and Edge Functions." bullets={['Edge Function deploys & status', 'Request volume & error rates', 'Latency percentiles', 'Rate limits & throttling', 'Recent invocations', 'Function logs']} note="The admin Edge Function powering user & org management is live." />;
      case 'svc-db':
        return <PlatformModulePlaceholder icon={Database} title="Database" description="Supabase Postgres health and usage." bullets={['Database size & growth', 'Table row counts', 'Slow-query insights', 'Connection pool status', 'Backups & point-in-time recovery', 'Row-Level Security overview']} note="Live metrics connect via the Supabase management API in a later phase." />;
      case 'svc-storage':
        return <PlatformModulePlaceholder icon={HardDrive} title="Storage" description="File storage buckets and usage across organizations." bullets={['Buckets & object counts', 'Storage used per organization', 'Upload / download activity', 'Access policies', 'Large-file report', 'Retention rules']} />;
      case 'feature-flags':
        return <PlatformModulePlaceholder icon={Flag} title="Feature Flags" description="Roll features out per organization or globally." bullets={['Global feature toggles', 'Per-organization overrides', 'Gradual rollouts', 'Beta program access', 'Kill switches', 'Flag change history']} />;
      case 'system-health':
        return <PlatformModulePlaceholder icon={Gauge} title="System Health" description="Live status of platform services and infrastructure." bullets={['Service uptime & incidents', 'Latency & error rates', 'Background job status', 'Realtime connections', 'Email delivery health', 'Status page']} note="Basic service status shows on the Dashboard today." />;
      case 'dashboard':
      default:
        return <PlatformDashboard organizations={organizations} users={users} auditLogs={auditLogs} userName={currentUser.name} setView={setView} />;
    }
  };

  if (inviteFlow) {
    return (
      <AcceptInviteView
        onComplete={(user) => {
          setInviteFlow(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          handleLoginSuccess(user);
        }}
        onCancel={() => {
          setInviteFlow(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

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

  // Platform Team members (super admin or any platform role) get the platform
  // console — never the operational app.
  if (currentUser.isPlatformAdmin || currentUser.platformRole) {
    return (
      <div className="flex bg-[#F4F7F9] min-h-screen text-slate-800 antialiased font-sans relative">
        <PlatformSidebar currentView={currentView} setView={setView} userName={currentUser.name} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header currentView={currentView} userRole={currentUser.role} userName={currentUser.name} notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} orgName="Platform Console" onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} setView={setView} platformMode />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">{renderPlatformView()}</main>
        </div>
      </div>
    );
  }

  // Customer workspace lockout: expired trial or suspended org (platform users exempt).
  const access = workspaceAccess(org, false);
  if (access.locked && access.reason) {
    return <WorkspaceLockedView org={org} reason={access.reason} onLogout={handleLogout} />;
  }

  return (
    <div className="flex bg-[#F4F7F9] min-h-screen text-slate-800 antialiased font-sans relative">
      <Sidebar currentView={currentView} setView={setView} userRole={currentUser.role} userName={currentUser.name} permissions={effectivePermissions} isPlatformAdmin={!!currentUser.isPlatformAdmin} enabledModules={org.enabledModules} onLogout={handleLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentView={currentView} userRole={currentUser.role} userName={currentUser.name} notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} orgName={org.companyName} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} setView={setView} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} opsSummary={opsSummary} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderMainView()}
        </main>
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onOpen={() => setIsCommandPaletteOpen(true)}
        onClose={() => setIsCommandPaletteOpen(false)}
        voyages={voyages}
        vessels={vessels}
        tasks={tasks}
        documents={documents}
        expenses={expenses}
        users={users}
        setView={setView}
      />
    </div>
  );
}
