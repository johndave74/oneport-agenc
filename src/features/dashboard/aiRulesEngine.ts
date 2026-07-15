import { Expense, Incident, Voyage, Task, LaytimeCalculation } from '@/types';
import { getLaytimeMath } from '@/lib/laytime';

export type RuleSeverity = 'info' | 'warning' | 'critical';

export interface RuleFinding {
  id: string;
  severity: RuleSeverity;
  title: string;
  detail: string;
  view: string;
}

const severityRank: Record<RuleSeverity, number> = { critical: 0, warning: 1, info: 2 };

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function ruleLaytimeRisk(calcs: LaytimeCalculation[]): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const calc of calcs) {
    if (calc.status !== 'Draft' && calc.status !== 'Sent for Approval') continue;
    if (calc.sofEvents.length < 2) continue;
    const math = getLaytimeMath(calc);
    if (math.allowedHours <= 0) continue;
    if (math.isDemurrage) {
      findings.push({
        id: `laytime-${calc.id}`,
        severity: 'critical',
        title: `Demurrage exceeded — ${calc.vesselName}`,
        detail: `${math.varianceDays.toFixed(1)}d over allowed laytime on voyage ${calc.voyageNumber}, est. $${Math.round(math.financialAmount).toLocaleString()}.`,
        view: 'laytime',
      });
    } else if (math.usedHours >= 0.85 * math.allowedHours) {
      findings.push({
        id: `laytime-warn-${calc.id}`,
        severity: 'warning',
        title: `Laytime nearing limit — ${calc.vesselName}`,
        detail: `${Math.round((math.usedHours / math.allowedHours) * 100)}% of allowed laytime used on voyage ${calc.voyageNumber}.`,
        view: 'laytime',
      });
    }
  }
  return findings;
}

function ruleAgingExpenses(expenses: Expense[], now: Date): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const e of expenses) {
    if (e.status !== 'Pending Approval' || !e.submittedAt) continue;
    const days = daysBetween(now, new Date(e.submittedAt));
    if (days > 7) {
      findings.push({ id: `exp-${e.id}`, severity: 'critical', title: `FDA awaiting approval — ${e.voyageNumber}`, detail: `${e.category} expense of $${e.amount.toLocaleString()} has been pending ${Math.floor(days)} days.`, view: 'expenses' });
    } else if (days > 3) {
      findings.push({ id: `exp-warn-${e.id}`, severity: 'warning', title: `FDA awaiting approval — ${e.voyageNumber}`, detail: `${e.category} expense of $${e.amount.toLocaleString()} pending ${Math.floor(days)} days.`, view: 'expenses' });
    }
  }
  return findings;
}

function ruleStaleIncidents(incidents: Incident[], now: Date): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const i of incidents) {
    if (i.status === 'Resolved' || !i.createdAt) continue;
    const days = daysBetween(now, new Date(i.createdAt));
    const isSevere = i.severity === 'Critical' || i.severity === 'High';
    if (days > 2) {
      const shortDesc = i.description.length > 100 ? `${i.description.slice(0, 100)}…` : i.description;
      findings.push({
        id: `inc-${i.id}`,
        severity: isSevere ? 'critical' : 'warning',
        title: `${isSevere ? 'Unresolved' : 'Open'} ${i.severity.toLowerCase()} incident — ${i.voyageNumber}`,
        detail: shortDesc,
        view: 'dashboard',
      });
    }
  }
  return findings;
}

function ruleOverdueMilestones(voyages: Voyage[], now: Date): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const v of voyages) {
    if (!v.eta || new Date(v.eta).getTime() >= now.getTime()) continue;
    const pending = v.timeline.find(t => !t.completed);
    if (pending) {
      findings.push({
        id: `voy-${v.id}`,
        severity: 'warning',
        title: `Overdue milestone — ${v.vesselName}`,
        detail: `"${pending.event}" still pending on voyage ${v.voyageNumber} (ETA was ${v.eta.replace('T', ' ')}).`,
        view: 'voyages',
      });
    }
  }
  return findings;
}

function ruleOverdueTasks(tasks: Task[], now: Date): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const t of tasks) {
    if (t.status === 'Completed' || !t.dueDate) continue;
    if (new Date(t.dueDate).getTime() < now.getTime()) {
      findings.push({
        id: `task-${t.id}`,
        severity: 'info',
        title: `Overdue task — ${t.title}`,
        detail: `Voyage ${t.voyageNumber} · due ${t.dueDate.replace('T', ' ')} · assigned to ${t.assignedTo.replace('_', ' ')}.`,
        view: 'tasks',
      });
    }
  }
  return findings;
}

export function computeRuleFindings(args: {
  laytimeCalculations: LaytimeCalculation[];
  expenses: Expense[];
  incidents: Incident[];
  voyages: Voyage[];
  tasks: Task[];
  now?: Date;
}): RuleFinding[] {
  const now = args.now ?? new Date();
  const findings = [
    ...ruleLaytimeRisk(args.laytimeCalculations),
    ...ruleAgingExpenses(args.expenses, now),
    ...ruleStaleIncidents(args.incidents, now),
    ...ruleOverdueMilestones(args.voyages, now),
    ...ruleOverdueTasks(args.tasks, now),
  ];
  return findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
