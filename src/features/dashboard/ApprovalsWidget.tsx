import React from 'react';
import { CheckCircle2, Check, X, AlertTriangle, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Expense } from '@/types';

interface ApprovalsWidgetProps {
  expenses: Expense[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  setView: (view: string) => void;
}

export default function ApprovalsWidget({ expenses, onApprove, onReject, setView }: ApprovalsWidgetProps) {
  const pending = expenses.filter((e) => e.status === 'Pending Approval');

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#6C4CE1]" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Approvals</h4>
        </div>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 tabular-nums">{pending.length} pending</span>
        )}
      </div>

      {pending.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing awaiting approval." description="Disbursement accounts (FDA) submitted for sign-off will queue here." size="sm" />
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {pending.slice(0, 6).map((e) => {
            const overrun = e.amount > e.estimatedAmount * 1.1;
            return (
              <div key={e.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">{e.category}</span>
                    <span className="text-[10px] text-slate-400 tabular-nums">{e.voyageNumber} · {e.submittedBy}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 block tabular-nums">${e.amount.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 tabular-nums">est ${e.estimatedAmount.toLocaleString()}</span>
                  </div>
                </div>
                {overrun && (
                  <div className="flex items-center gap-1.5 text-rose-600 tabular-nums text-[9px] font-bold bg-rose-50 px-2 py-1 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    +{Math.round(((e.amount - e.estimatedAmount) / e.estimatedAmount) * 100)}% over PDA estimate
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onReject(e.id)} className="flex items-center gap-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer">
                    <X className="h-3 w-3" /> Reject
                  </button>
                  <button onClick={() => onApprove(e.id)} className="flex items-center gap-1 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-2.5 py-1 rounded text-[10px] font-semibold shadow-sm transition-colors cursor-pointer">
                    <Check className="h-3 w-3" /> Approve
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setView('approvals')} className="w-full flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-[#6C4CE1] hover:bg-slate-50 transition-colors cursor-pointer">
            Open approvals inbox <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
