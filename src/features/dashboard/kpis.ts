import { Vessel, Voyage, Task, Expense, LaytimeCalculation } from '@/types';
import { getLaytimeMath } from '@/lib/laytime';

export function todayLocalDateString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isVoyageRelevantToday(v: Voyage, today: string): boolean {
  const dates = [v.eta, v.etb, v.etd].filter(Boolean) as string[];
  if (dates.some(d => d.slice(0, 10) === today)) return true;
  if (v.eta && v.etd && v.eta.slice(0, 10) <= today && v.etd.slice(0, 10) >= today) return true;
  return false;
}

export interface CommandKpis {
  todaysPortCalls: number;
  shipsAtBerth: number;
  expectedArrivals: number;
  expectedDepartures: number;
  pendingFdaCount: number;
  pendingFdaAmount: number;
  laytimeRunningCount: number;
  demurrageExceededCount: number;
  demurrageNearingCount: number;
  outstandingTasksCount: number;
  overdueTasksCount: number;
  highCostOverrunsCount: number;
}

export function computeCommandKpis(args: {
  vessels: Vessel[];
  voyages: Voyage[];
  tasks: Task[];
  expenses: Expense[];
  laytimeCalculations: LaytimeCalculation[];
  now?: Date;
}): CommandKpis {
  const { vessels, voyages, tasks, expenses, laytimeCalculations, now = new Date() } = args;
  const today = todayLocalDateString(now);
  const nowMs = now.getTime();

  const todaysVoyages = voyages.filter(v => isVoyageRelevantToday(v, today));
  const pendingFda = expenses.filter(e => e.status === 'Pending Approval');
  const activeLaytime = laytimeCalculations.filter(c => c.status === 'Draft' || c.status === 'Sent for Approval');

  let demurrageExceededCount = 0;
  let demurrageNearingCount = 0;
  for (const calc of activeLaytime) {
    if (calc.sofEvents.length < 2) continue;
    const math = getLaytimeMath(calc);
    if (math.allowedHours <= 0) continue;
    if (math.isDemurrage) demurrageExceededCount++;
    else if (math.usedHours >= 0.85 * math.allowedHours) demurrageNearingCount++;
  }

  const outstandingTasks = tasks.filter(t => t.status !== 'Completed');
  const overdueTasks = outstandingTasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < nowMs);

  return {
    todaysPortCalls: todaysVoyages.length,
    shipsAtBerth: vessels.filter(v => v.status === 'Berthed' || v.status === 'Cargo Operations').length,
    expectedArrivals: voyages.filter(v => v.eta?.slice(0, 10) === today && !v.actualEta).length,
    expectedDepartures: voyages.filter(v => v.etd?.slice(0, 10) === today && !v.actualEtd).length,
    pendingFdaCount: pendingFda.length,
    pendingFdaAmount: pendingFda.reduce((sum, e) => sum + e.amount, 0),
    laytimeRunningCount: activeLaytime.length,
    demurrageExceededCount,
    demurrageNearingCount,
    outstandingTasksCount: outstandingTasks.length,
    overdueTasksCount: overdueTasks.length,
    highCostOverrunsCount: expenses.filter(e => e.amount > e.estimatedAmount * 1.2 && e.status === 'Pending Approval').length,
  };
}
