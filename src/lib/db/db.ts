import { supabase } from '@/lib/supabase/client';
import {
  User,
  UserRole,
  Vessel,
  VesselStatus,
  Voyage,
  Task,
  TaskStatus,
  Document,
  Expense,
  Message,
  Notification,
  Incident,
  AuditLog,
  Organization,
  LaytimeCalculation,
} from '@/types';

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const Db = {
  // ---------------------------------------------------------------- Org
  async getOrg(): Promise<Organization> {
    const { data, error } = await supabase.from('organizations').select('*').eq('id', 'org-1').maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { id: 'org-1', companyName: 'Oneport Agenc' };
  },

  async setOrg(org: Organization): Promise<Organization> {
    const res = await supabase.from('organizations').upsert(org).select().single();
    return unwrap(res as any);
  },

  // -------------------------------------------------------------- Users
  async getUsers(): Promise<User[]> {
    const res = await supabase.from('users').select('*');
    return unwrap(res as any);
  },

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const res = await supabase.from('users').update({ role }).eq('id', userId).select().single();
    return unwrap(res as any);
  },

  async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const res = await supabase.from('users').update(updates).eq('id', userId).select().single();
    return unwrap(res as any);
  },

  // ------------------------------------------------------------ Vessels
  async getVessels(): Promise<Vessel[]> {
    const res = await supabase.from('vessels').select('*');
    return unwrap(res as any);
  },

  async addVessel(vessel: Omit<Vessel, 'id'>): Promise<Vessel> {
    const item: Vessel = { id: `ves-${Date.now()}`, ...vessel };
    const res = await supabase.from('vessels').insert(item).select().single();
    return unwrap(res as any);
  },

  async updateVessel(vessel: Vessel): Promise<Vessel> {
    const res = await supabase.from('vessels').update(vessel).eq('id', vessel.id).select().single();
    return unwrap(res as any);
  },

  async updateVesselStatus(id: string, status: VesselStatus): Promise<Vessel> {
    const res = await supabase.from('vessels').update({ status }).eq('id', id).select().single();
    return unwrap(res as any);
  },

  async deleteVessel(id: string): Promise<void> {
    const { error } = await supabase.from('vessels').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ------------------------------------------------------------ Voyages
  async getVoyages(): Promise<Voyage[]> {
    const res = await supabase.from('voyages').select('*');
    return unwrap(res as any);
  },

  async addVoyage(voyage: Omit<Voyage, 'id'>): Promise<Voyage> {
    const item: Voyage = { id: `voy-${Date.now()}`, ...voyage };
    const res = await supabase.from('voyages').insert(item).select().single();
    return unwrap(res as any);
  },

  async updateVoyage(id: string, updates: Partial<Voyage>): Promise<Voyage> {
    const res = await supabase.from('voyages').update(updates).eq('id', id).select().single();
    return unwrap(res as any);
  },

  // -------------------------------------------------------------- Tasks
  async getTasks(): Promise<Task[]> {
    const res = await supabase.from('tasks').select('*');
    return unwrap(res as any);
  },

  async addTask(task: Omit<Task, 'id'>): Promise<Task> {
    const item: Task = { id: `tsk-${Date.now()}`, ...task };
    const res = await supabase.from('tasks').insert(item).select().single();
    return unwrap(res as any);
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const res = await supabase.from('tasks').update({ status }).eq('id', id).select().single();
    return unwrap(res as any);
  },

  // ---------------------------------------------------------- Documents
  async getDocuments(): Promise<Document[]> {
    const res = await supabase.from('documents').select('*');
    return unwrap(res as any);
  },

  async addDocument(
    doc: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt' | 'version'>,
    uploadedBy: string
  ): Promise<Document> {
    const item: Document = {
      id: `doc-${Date.now()}`,
      ...doc,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      version: 1,
    };
    const res = await supabase.from('documents').insert(item).select().single();
    return unwrap(res as any);
  },

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ----------------------------------------------------------- Expenses
  async getExpenses(): Promise<Expense[]> {
    const res = await supabase.from('expenses').select('*');
    return unwrap(res as any);
  },

  async addExpense(
    expense: Omit<Expense, 'id' | 'submittedBy' | 'submittedAt'>,
    submittedBy: string
  ): Promise<Expense> {
    const item: Expense = {
      id: `exp-${Date.now()}`,
      ...expense,
      submittedBy,
      submittedAt: new Date().toISOString(),
    };
    const res = await supabase.from('expenses').insert(item).select().single();
    return unwrap(res as any);
  },

  async updateExpenseStatus(id: string, status: Expense['status']): Promise<Expense> {
    const res = await supabase.from('expenses').update({ status }).eq('id', id).select().single();
    return unwrap(res as any);
  },

  // ----------------------------------------------------------- Messages
  async getMessages(): Promise<Message[]> {
    const res = await supabase.from('messages').select('*').order('timestamp', { ascending: true });
    return unwrap(res as any);
  },

  async addMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const item: Message = { id: `msg-${Date.now()}`, ...message };
    const res = await supabase.from('messages').insert(item).select().single();
    return unwrap(res as any);
  },

  // ------------------------------------------------------ Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await supabase.from('notifications').select('*').order('createdAt', { ascending: false });
    return unwrap(res as any);
  },

  async addNotification(userId: string, message: string, type: Notification['type']): Promise<Notification> {
    const item: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      message,
      status: 'Unread',
      createdAt: new Date().toISOString().substring(0, 16),
      type,
    };
    const res = await supabase.from('notifications').insert(item).select().single();
    return unwrap(res as any);
  },

  async markNotificationRead(id: string): Promise<Notification> {
    const res = await supabase.from('notifications').update({ status: 'Read' }).eq('id', id).select().single();
    return unwrap(res as any);
  },

  async markAllNotificationsRead(): Promise<void> {
    const { error } = await supabase.from('notifications').update({ status: 'Read' }).eq('status', 'Unread');
    if (error) throw new Error(error.message);
  },

  // ---------------------------------------------------------- Incidents
  async getIncidents(): Promise<Incident[]> {
    const res = await supabase.from('incidents').select('*').order('createdAt', { ascending: false });
    return unwrap(res as any);
  },

  async addIncident(incident: Omit<Incident, 'id'>): Promise<Incident> {
    const item: Incident = { id: `inc-${Date.now()}`, ...incident };
    const res = await supabase.from('incidents').insert(item).select().single();
    return unwrap(res as any);
  },

  // --------------------------------------------------------- Audit logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
    return unwrap(res as any);
  },

  async addAuditLog(userId: string, userName: string, action: string, details: string): Promise<AuditLog> {
    const item: AuditLog = {
      id: `aud-${Date.now()}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString().substring(0, 16),
    };
    const res = await supabase.from('audit_logs').insert(item).select().single();
    return unwrap(res as any);
  },

  // ---------------------------------------------------------- Laytime
  async getLaytimeCalculations(): Promise<LaytimeCalculation[]> {
    const res = await supabase.from('laytime_calculations').select('*');
    return unwrap(res as any);
  },

  async addLaytimeCalculation(calc: LaytimeCalculation): Promise<LaytimeCalculation> {
    const res = await supabase.from('laytime_calculations').insert(calc).select().single();
    return unwrap(res as any);
  },

  async updateLaytimeCalculation(calc: LaytimeCalculation): Promise<LaytimeCalculation> {
    const res = await supabase.from('laytime_calculations').update(calc).eq('id', calc.id).select().single();
    return unwrap(res as any);
  },

  async deleteLaytimeCalculation(id: string): Promise<void> {
    const { error } = await supabase.from('laytime_calculations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
