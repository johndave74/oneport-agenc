import React from 'react';
import { Wallet, ChevronRight, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { FinanceSnapshot, money } from './commandData';

interface FinancialSnapshotProps {
  finance: FinanceSnapshot;
  setView: (view: string) => void;
}

export default function FinancialSnapshot({ finance, setView }: FinancialSnapshotProps) {
  const c = finance.currency;
  const primary = [
    { label: "Today's Revenue", value: money(finance.todaysRevenue, c), tone: 'text-emerald-600', view: 'invoices' },
    { label: 'Monthly Revenue', value: money(finance.monthlyRevenue, c), tone: 'text-slate-900', view: 'invoices' },
    { label: 'Outstanding Receivables', value: money(finance.outstandingReceivables, c), tone: 'text-sky-600', view: 'invoices' },
  ];
  const secondary = [
    { label: 'Outstanding FDA', value: money(finance.outstandingFda, c), view: 'expenses' },
    { label: 'Vendor Payments Due', value: money(finance.outstandingVendorPayments, c), view: 'expenses' },
    { label: 'Invoices Awaiting Approval', value: String(finance.invoicesAwaitingApproval), view: 'approvals' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[#6C4CE1]" />
          <h4 className="text-sm font-bold text-slate-800">Financial Snapshot</h4>
        </div>
        <button onClick={() => setView('invoices')} className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center gap-1 cursor-pointer">
          <span className="hidden sm:inline">Invoices</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {primary.map((p) => (
          <button key={p.label} onClick={() => setView(p.view)} className="p-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{p.label}</span>
            <span className={`text-2xl font-bold tabular-nums mt-1 block ${p.tone}`}>{p.value}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
        {secondary.map((s) => (
          <button key={s.label} onClick={() => setView(s.view)} className="p-3 text-left hover:bg-slate-50/60 transition-colors cursor-pointer">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 block leading-tight">{s.label}</span>
            <span className="text-sm font-bold text-slate-700 tabular-nums mt-1 block">{s.value}</span>
          </button>
        ))}
      </div>

      {finance.overdueInvoicesCount > 0 && (
        <button onClick={() => setView('invoices')} className="w-full flex items-center gap-2 px-4 py-2.5 bg-rose-50 border-t border-rose-100 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[11px] font-semibold">{finance.overdueInvoicesCount} overdue invoice{finance.overdueInvoicesCount > 1 ? 's' : ''} · {money(finance.overdueInvoicesAmount, c)} outstanding</span>
          <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />
        </button>
      )}
    </div>
  );
}
