import React from 'react';
import { Lock, Clock, ShieldAlert, LogOut, Mail } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { Organization } from '@/types';

interface WorkspaceLockedViewProps {
  org: Organization;
  reason: 'trial_expired' | 'suspended';
  onLogout: () => void;
}

export default function WorkspaceLockedView({ org, reason, onLogout }: WorkspaceLockedViewProps) {
  const trial = reason === 'trial_expired';
  const Icon = trial ? Clock : ShieldAlert;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2EFFF] p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
            <Lock className="h-3 w-3" /> Locked
          </span>
        </div>

        <div className="p-8 text-center">
          <span className="h-16 w-16 rounded-2xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8" />
          </span>

          {trial ? (
            <>
              <h1 className="text-xl font-bold text-slate-900">Your free trial has ended</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
                The 14-day trial for <strong className="text-slate-700">{org.companyName}</strong> is over. To keep managing your vessel operations, choose a paid plan.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900">Workspace unavailable</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
                Access to <strong className="text-slate-700">{org.companyName}</strong> is currently suspended. Please contact OnePort Agency to restore access.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-col items-center gap-3">
            <a
              href="mailto:accounts@oneport.example?subject=OnePort%20plan%20activation"
              className="w-full max-w-xs bg-[#6C4CE1] hover:bg-[#5839C6] text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" /> {trial ? 'Contact us to choose a plan' : 'Contact OnePort Agency'}
            </a>
            <button onClick={onLogout} className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
            Your data is safe and will be restored the moment your plan is activated. Only OnePort Agency can activate or change your plan.
          </p>
        </div>
      </div>
    </div>
  );
}
