// OnePort subscription plans — the pricing + entitlement catalogue.
//
// A plan controls (a) monthly price, (b) max users, and (c) which product
// modules are unlocked (enabledModules). Assigning a plan to an organization
// sets its enabledModules, which the sidebar/guards use for feature gating.
// Admin/account modules (users, company, audit_logs, dashboard, settings,
// notifications, subscription) are always available and are NOT plan-gated.

import { ModuleId } from '@/lib/rbac/permissions';

export type PlanId = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // USD; 0 = negotiated/custom
  maxUsers: number | null; // null = unlimited
  /** Product modules unlocked. null = all product modules (Enterprise). */
  modules: ModuleId[] | null;
  blurb: string;
}

// Product modules a plan can unlock (admin/account modules are always on).
const STARTER_MODULES: ModuleId[] = ['port_calls', 'vessels', 'tasks', 'documents', 'reports'];
const PROFESSIONAL_MODULES: ModuleId[] = [
  'port_calls', 'planning', 'vessels', 'tasks', 'documents',
  'expenses', 'invoices', 'tariffs', 'approvals', 'laytime', 'partners', 'agents', 'messages', 'reports',
];

export const PLANS: Record<PlanId, Plan> = {
  STARTER: { id: 'STARTER', name: 'Starter', priceMonthly: 99, maxUsers: 5, modules: STARTER_MODULES, blurb: 'Core port-call operations for small agencies.' },
  PROFESSIONAL: { id: 'PROFESSIONAL', name: 'Professional', priceMonthly: 299, maxUsers: 25, modules: PROFESSIONAL_MODULES, blurb: 'Full operations, commercial and laytime for growing agencies.' },
  ENTERPRISE: { id: 'ENTERPRISE', name: 'Enterprise', priceMonthly: 799, maxUsers: null, modules: null, blurb: 'Everything, unlimited users, priority support.' },
  CUSTOM: { id: 'CUSTOM', name: 'Custom', priceMonthly: 0, maxUsers: null, modules: null, blurb: 'Negotiated plan for large/bespoke deployments.' },
};

export const PLAN_LIST: Plan[] = [PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.ENTERPRISE, PLANS.CUSTOM];

export type PlanStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
export const PLAN_STATUSES: PlanStatus[] = ['trial', 'active', 'past_due', 'suspended', 'cancelled'];

/** Resolve a plan by its stored name/id (case-insensitive); defaults to Professional. */
export function resolvePlan(name?: string | null): Plan {
  if (!name) return PLANS.PROFESSIONAL;
  const key = name.toUpperCase() as PlanId;
  return PLANS[key] || PLAN_LIST.find((p) => p.name.toLowerCase() === name.toLowerCase()) || PLANS.PROFESSIONAL;
}

/** enabledModules array to persist for a plan (null = all, stored as null). */
export function modulesForPlan(planId: PlanId): ModuleId[] | null {
  return PLANS[planId].modules;
}

/** Monthly revenue counted for a status (trials & cancelled don't bill). */
export function billableMonthly(plan: Plan, status?: string): number {
  const s = (status || 'active').toLowerCase();
  if (s === 'trial' || s === 'cancelled' || s === 'suspended') return 0;
  return plan.priceMonthly;
}

export function money(n: number): string {
  return `$${n.toLocaleString()}`;
}

// ---------------------------------------------------------------- Trials

export const TRIAL_DAYS = 14;

/** ISO timestamp 14 days from now — the trial end date. */
export function trialEndFromNow(): string {
  return new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
}

/** Whole days remaining until an expiry date (negative = past). null if no date. */
export function daysLeft(expiry?: string | null): number | null {
  if (!expiry) return null;
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
}

export interface AccessState {
  locked: boolean;
  reason: 'trial_expired' | 'suspended' | null;
}

// Whether a customer workspace is locked. Platform users are never locked.
export function workspaceAccess(
  org: { status?: string; planStatus?: string; planExpiry?: string | null } | null | undefined,
  isPlatformUser: boolean,
): AccessState {
  if (isPlatformUser || !org) return { locked: false, reason: null };
  const status = (org.planStatus || 'active').toLowerCase();
  if (org.status === 'suspended' || status === 'suspended' || status === 'cancelled') {
    return { locked: true, reason: 'suspended' };
  }
  if (status === 'trial' && org.planExpiry) {
    const left = daysLeft(org.planExpiry);
    if (left !== null && left <= 0) return { locked: true, reason: 'trial_expired' };
  }
  return { locked: false, reason: null };
}
