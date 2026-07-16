import React from 'react';
import { CheckSquare, Check, X, AlertTriangle } from 'lucide-react';
import { Expense, Incident, UserRole } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface ApprovalsViewProps {
  expenses: Expense[];
  incidents: Incident[];
  onApproveExpense: (id: string) => void;
  onRejectExpense: (id: string) => void;
  userRole: UserRole;
}

export default function ApprovalsView({ expenses, incidents, onApproveExpense, onRejectExpense, userRole }: ApprovalsViewProps) {
  const pendingExpenses = expenses.filter(e => e.status === 'Pending Approval');
  const openIncidents = incidents.filter(i => i.status !== 'Resolved');
  const canAct = userRole === 'PROTECTIVE_AGENT' || userRole === 'ADMIN';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2">
          <CheckSquare className="h-4.5 w-4.5 text-[#6C4CE1]" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pending Expense Approvals ({pendingExpenses.length})</h3>
        </div>
        {pendingExpenses.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No expenses awaiting approval" size="sm" />
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {pendingExpenses.map((e) => (
              <div key={e.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-bold text-slate-800 block">{e.category}</span>
                    <span className="text-[10px] text-slate-400">Voyage {e.voyageNumber} · Submitted by {e.submittedBy}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 shrink-0">${e.amount.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">{e.description}</p>
                {canAct ? (
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => onRejectExpense(e.id)} className="bg-slate-50 hover:bg-rose-100 hover:text-rose-700 text-slate-500 border border-slate-200 px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer font-semibold">
                      <X className="h-3 w-3" /> Reject
                    </button>
                    <button onClick={() => onApproveExpense(e.id)} className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-2.5 py-1 rounded flex items-center gap-1 shadow-sm transition-colors cursor-pointer font-semibold">
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono italic">Awaiting Protective Agent / Admin review</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2">
          <AlertTriangle className="h-4.5 w-4.5 text-[#6C4CE1]" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Open Incidents ({openIncidents.length})</h3>
        </div>
        {openIncidents.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No open incidents" size="sm" />
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {openIncidents.map((i) => (
              <div key={i.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-800 block">Voyage {i.voyageNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    i.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    i.severity === 'High' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {i.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-1">{i.description}</p>
                <span className="text-[10px] text-slate-400 font-mono">Reported by {i.reportedBy} · {i.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
