import { LaytimeCalculation } from '@/types';

export interface LaytimeMathRow {
  id: string;
  fromEvent: string;
  toEvent: string;
  fromTime: string;
  toTime: string;
  durationHours: number;
  percent: number;
  countableHours: number;
  runningTotal: number;
  remaining: number;
  comments?: string;
}

export interface LaytimeMath {
  allowedHours: number;
  allowedDays: number;
  usedHours: number;
  usedDays: number;
  varianceDays: number;
  isDemurrage: boolean;
  financialAmount: number;
  rows: LaytimeMathRow[];
  sortedEvents: LaytimeCalculation['sofEvents'];
}

// Shared by the Laytime Ledger (LaytimeCalculatorView) and the dashboard's
// demurrage-risk KPI / AI rules engine, so both read the exact same math.
export function getLaytimeMath(calc: LaytimeCalculation): LaytimeMath {
  const allowedDays = calc.cargoQuantity / calc.loadingRate;
  const allowedHours = allowedDays * 24;

  const events = [...calc.sofEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const rows: LaytimeMathRow[] = [];
  let runningTotal = 0;

  for (let i = 0; i < events.length - 1; i++) {
    const start = new Date(events[i].timestamp);
    const end = new Date(events[i + 1].timestamp);
    const diffMs = end.getTime() - start.getTime();
    const durationHours = Math.max(0, diffMs / (1000 * 60 * 60));

    const percent = events[i].isCountable;
    const countableHours = durationHours * (percent / 100);
    runningTotal += countableHours;

    rows.push({
      id: events[i].id,
      fromEvent: events[i].eventDescription,
      toEvent: events[i + 1].eventDescription,
      fromTime: events[i].timestamp,
      toTime: events[i + 1].timestamp,
      durationHours,
      percent,
      countableHours,
      runningTotal,
      remaining: Math.max(0, allowedHours - runningTotal),
      comments: events[i].comments
    });
  }

  const laytimeUsedDays = runningTotal / 24;
  const varianceDays = laytimeUsedDays - allowedDays;
  const isDemurrage = varianceDays > 0;
  const financialAmount = isDemurrage
    ? varianceDays * calc.demurrageRate
    : Math.abs(varianceDays) * calc.despatchRate;

  return {
    allowedHours,
    allowedDays,
    usedHours: runningTotal,
    usedDays: laytimeUsedDays,
    varianceDays: Math.abs(varianceDays),
    isDemurrage,
    financialAmount,
    rows,
    sortedEvents: events
  };
}
