// Derived data for the Maritime Operations Command Centre.
//
// Everything here is computed from the real workspace tables the app already
// loads (voyages, vessels, invoices, expenses, crew, partners, users, audit
// logs). Components stay presentational; all the maritime/finance logic lives
// here so it is testable and consistent across widgets.

import {
  Vessel,
  Voyage,
  Task,
  Expense,
  Incident,
  Invoice,
  Partner,
  CrewMember,
  User,
  AuditLog,
} from '@/types';
import { todayLocalDateString, isVoyageRelevantToday } from './kpis';

// ---------------------------------------------------------------- Finance

export interface FinanceSnapshot {
  currency: string;
  todaysRevenue: number;
  monthlyRevenue: number;
  outstandingReceivables: number;
  outstandingFda: number;
  outstandingVendorPayments: number;
  invoicesAwaitingApproval: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
}

export function computeFinance(
  invoices: Invoice[],
  expenses: Expense[],
  now: Date = new Date()
): FinanceSnapshot {
  const today = todayLocalDateString(now);
  const monthPrefix = today.slice(0, 7);
  const currency = invoices.find(i => i.currency)?.currency || 'USD';

  const paid = invoices.filter(i => i.status === 'Paid');
  const todaysRevenue = paid
    .filter(i => (i.issueDate || '').slice(0, 10) === today)
    .reduce((s, i) => s + i.amount, 0);
  const monthlyRevenue = paid
    .filter(i => (i.issueDate || '').slice(0, 7) === monthPrefix)
    .reduce((s, i) => s + i.amount, 0);

  const receivable = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue');
  const outstandingReceivables = receivable.reduce((s, i) => s + i.amount, 0);

  const overdue = invoices.filter(
    i =>
      i.status === 'Overdue' ||
      (i.status === 'Sent' && (i.dueDate || '').slice(0, 10) < today)
  );

  const pendingFda = expenses.filter(e => e.status === 'Pending Approval');
  const approvedUnpaid = expenses.filter(e => e.status === 'Approved');

  return {
    currency,
    todaysRevenue,
    monthlyRevenue,
    outstandingReceivables,
    outstandingFda: pendingFda.reduce((s, e) => s + e.amount, 0),
    outstandingVendorPayments: approvedUnpaid.reduce((s, e) => s + e.amount, 0),
    invoicesAwaitingApproval: pendingFda.length,
    overdueInvoicesCount: overdue.length,
    overdueInvoicesAmount: overdue.reduce((s, i) => s + i.amount, 0),
  };
}

// ------------------------------------------------------ Operational health

export interface OperationalHealth {
  score: number;
  label: 'Normal' | 'Warning' | 'Critical';
  attentionCount: number;
  reasons: string[];
}

export function computeHealth(args: {
  incidents: Incident[];
  tasks: Task[];
  invoices: Invoice[];
  demurrageExceeded: number;
  now?: Date;
}): OperationalHealth {
  const { incidents, tasks, invoices, demurrageExceeded, now = new Date() } = args;
  const today = todayLocalDateString(now);
  const nowMs = now.getTime();

  const critIncidents = incidents.filter(
    i => i.status !== 'Resolved' && (i.severity === 'Critical' || i.severity === 'High')
  ).length;
  const overdueTasks = tasks.filter(
    t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate).getTime() < nowMs
  ).length;
  const overdueInvoices = invoices.filter(
    i => i.status === 'Overdue' || (i.status === 'Sent' && (i.dueDate || '').slice(0, 10) < today)
  ).length;

  let score = 100;
  const reasons: string[] = [];
  if (critIncidents) {
    score -= critIncidents * 10;
    reasons.push(`${critIncidents} open high/critical incident${critIncidents > 1 ? 's' : ''}`);
  }
  if (demurrageExceeded) {
    score -= demurrageExceeded * 8;
    reasons.push(`${demurrageExceeded} port call${demurrageExceeded > 1 ? 's' : ''} on demurrage`);
  }
  if (overdueTasks) {
    score -= Math.min(overdueTasks * 3, 18);
    reasons.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`);
  }
  if (overdueInvoices) {
    score -= Math.min(overdueInvoices * 3, 12);
    reasons.push(`${overdueInvoices} overdue invoice${overdueInvoices > 1 ? 's' : ''}`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const attentionCount = critIncidents + demurrageExceeded + overdueInvoices;
  const label: OperationalHealth['label'] = score >= 90 ? 'Normal' : score >= 70 ? 'Warning' : 'Critical';

  return { score, label, attentionCount, reasons };
}

// ---------------------------------------------------------- Crew changes

export function crewChangesToday(crew: CrewMember[], now: Date = new Date()): CrewMember[] {
  const today = todayLocalDateString(now);
  return crew.filter(
    c => (c.signOnDate || '').slice(0, 10) === today || (c.signOffDate || '').slice(0, 10) === today
  );
}

// ------------------------------------------------------ Upcoming arrivals

export interface UpcomingArrival {
  voyage: Voyage;
  etaMs: number;
  hoursAway: number;
}

export function upcomingArrivals(voyages: Voyage[], now: Date = new Date(), limit = 6): UpcomingArrival[] {
  const nowMs = now.getTime();
  return voyages
    .filter(v => v.eta && !v.actualEta && new Date(v.eta).getTime() >= nowMs)
    .map(v => {
      const etaMs = new Date(v.eta).getTime();
      return { voyage: v, etaMs, hoursAway: (etaMs - nowMs) / 3.6e6 };
    })
    .sort((a, b) => a.etaMs - b.etaMs)
    .slice(0, limit);
}

// --------------------------------------------------------- Top principals

export interface PrincipalStat {
  id: string;
  name: string;
  revenue: number;
  invoiceCount: number;
  outstanding: number;
}

export function topPrincipals(
  partners: Partner[],
  invoices: Invoice[],
  limit = 5
): PrincipalStat[] {
  const principals = partners.filter(p => p.type === 'Principal' || p.type === 'Client');
  const byId = new Map<string, PrincipalStat>();
  for (const p of principals) {
    byId.set(p.id, { id: p.id, name: p.name, revenue: 0, invoiceCount: 0, outstanding: 0 });
  }
  for (const inv of invoices) {
    if (!inv.partnerId) continue;
    const stat =
      byId.get(inv.partnerId) ||
      byId.set(inv.partnerId, {
        id: inv.partnerId,
        name: inv.partnerName || 'Unknown Principal',
        revenue: 0,
        invoiceCount: 0,
        outstanding: 0,
      }).get(inv.partnerId)!;
    stat.invoiceCount += 1;
    if (inv.status === 'Paid') stat.revenue += inv.amount;
    if (inv.status === 'Sent' || inv.status === 'Overdue') stat.outstanding += inv.amount;
  }
  return [...byId.values()]
    .filter(s => s.invoiceCount > 0 || s.revenue > 0)
    .sort((a, b) => b.revenue + b.outstanding - (a.revenue + a.outstanding))
    .slice(0, limit);
}

// ------------------------------------------------------- Most active agents

export interface AgentStat {
  id: string;
  name: string;
  role: string;
  activePortCalls: number;
  openTasks: number;
  rating?: number;
}

const AGENT_ROLE_LABEL: Record<string, string> = {
  PORT_AGENT: 'Port Agent',
  SHIP_AGENT: 'Ship Agent',
  PROTECTIVE_AGENT: 'Protective Agent',
  ADMIN: 'Admin',
};

export function mostActiveAgents(
  users: User[],
  voyages: Voyage[],
  tasks: Task[],
  limit = 5
): AgentStat[] {
  const active = voyages.filter(v => v.status !== 'Completed');
  const stats = users
    .filter(u => u.role !== 'ADMIN')
    .map(u => {
      const activePortCalls = active.filter(
        v => v.portAgentId === u.id || v.shipAgentId === u.id || v.protectiveAgentId === u.id
      ).length;
      const openTasks = tasks.filter(
        t => t.status !== 'Completed' && (t.assignedTo === u.id || t.assignedTo === u.name || t.assignedTo === u.role)
      ).length;
      return {
        id: u.id,
        name: u.name,
        role: AGENT_ROLE_LABEL[u.role] || u.role,
        activePortCalls,
        openTasks,
        rating: u.rating,
      };
    })
    .filter(s => s.activePortCalls > 0 || s.openTasks > 0)
    .sort((a, b) => b.activePortCalls * 3 + b.openTasks - (a.activePortCalls * 3 + a.openTasks));
  return stats.slice(0, limit);
}

// ---------------------------------------------------------- Recent activity

export interface ActivityItem {
  id: string;
  time: string; // HH:MM
  timestamp: string;
  label: string;
  detail?: string;
  kind: 'audit' | 'milestone' | 'invoice' | 'incident';
}

function timeOf(ts: string): string {
  if (!ts) return '--:--';
  const t = ts.includes('T') ? ts.split('T')[1] : ts.split(' ')[1] || '';
  return t.slice(0, 5) || '--:--';
}

export function recentActivity(args: {
  auditLogs: AuditLog[];
  voyages: Voyage[];
  incidents: Incident[];
  limit?: number;
}): ActivityItem[] {
  const { auditLogs, voyages, incidents, limit = 8 } = args;
  const items: ActivityItem[] = [];

  for (const log of auditLogs) {
    items.push({
      id: `a-${log.id}`,
      time: timeOf(log.timestamp),
      timestamp: log.timestamp,
      label: log.action,
      detail: `${log.userName} · ${log.details}`,
      kind: 'audit',
    });
  }

  for (const v of voyages) {
    for (const [i, ev] of v.timeline.entries()) {
      if (ev.completed && ev.timestamp) {
        items.push({
          id: `m-${v.id}-${i}`,
          time: timeOf(ev.timestamp),
          timestamp: ev.timestamp,
          label: `${v.vesselName} — ${ev.event}`,
          detail: `Voyage ${v.voyageNumber}`,
          kind: 'milestone',
        });
      }
    }
  }

  for (const inc of incidents) {
    items.push({
      id: `i-${inc.id}`,
      time: timeOf(inc.createdAt),
      timestamp: inc.createdAt,
      label: `Incident reported — ${inc.severity}`,
      detail: `${inc.voyageNumber} · ${inc.reportedBy}`,
      kind: 'incident',
    });
  }

  return items
    .filter(i => i.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

// ------------------------------------------------------- Primary port call

// The single most operationally "live" voyage — the one whose timeline the
// Operational Timeline widget should surface (berthed/cargo first, then the
// nearest arrival).
export function primaryPortCall(voyages: Voyage[], vessels: Vessel[]): Voyage | undefined {
  const statusRank = (v: Voyage): number => {
    const vessel = vessels.find(x => x.id === v.vesselId);
    const s = vessel?.status || v.status;
    switch (s) {
      case 'Cargo Operations': return 0;
      case 'Berthed': return 1;
      case 'Arriving': return 2;
      case 'Departing': return 3;
      case 'Scheduled': return 4;
      default: return 5;
    }
  };
  const active = voyages.filter(v => v.status !== 'Completed');
  if (active.length === 0) return undefined;
  return [...active].sort((a, b) => {
    const r = statusRank(a) - statusRank(b);
    if (r !== 0) return r;
    return new Date(a.eta || 0).getTime() - new Date(b.eta || 0).getTime();
  })[0];
}

// ------------------------------------------------------------- Formatters

export function money(n: number, currency = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  const abs = Math.abs(n);
  const formatted =
    abs >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : abs >= 10_000
      ? `${Math.round(n / 1000)}K`
      : n.toLocaleString();
  return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
}
