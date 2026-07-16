import React, { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase/client';
import { Auth } from '@/lib/supabase/auth';
import { AdminApi } from '@/lib/supabase/adminApi';
import { User } from '@/types';

interface AcceptInviteViewProps {
  onComplete: (user: User) => void;
  onCancel: () => void;
}

export default function AcceptInviteView({ onComplete, onCancel }: AcceptInviteViewProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setEmail(data.session?.user.email ?? '');
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      // Best-effort: close the invitation record. Non-fatal if the Edge
      // Function isn't deployed — the password is already set.
      try { await AdminApi.acceptInvite(); } catch { /* ignore */ }
      const user = await Auth.getSessionUser();
      if (!user) throw new Error('Could not load your profile after setting the password.');
      onComplete(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2EFFF] p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Logo />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4CE1] bg-[#6C4CE1]/10 px-2 py-1 rounded-full">Accept Invitation</span>
        </div>

        <div className="p-6">
          {hasSession === false ? (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">This invitation link is invalid or expired</h1>
                <p className="text-sm text-slate-500 mt-1">Ask your organization admin to send a new invitation.</p>
              </div>
              <button onClick={onCancel} className="text-sm font-semibold text-[#6C4CE1] hover:underline">Back to sign in</button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Set your password</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Welcome to OnePort Agency{email ? <> — <span className="font-semibold text-slate-700">{email}</span></> : ''}. Choose a password to finish setting up your account.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                {['New password', 'Confirm password'].map((label, i) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={show ? 'text' : 'password'}
                        required
                        value={i === 0 ? password : confirm}
                        onChange={(e) => (i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value))}
                        placeholder={i === 0 ? 'At least 8 characters' : 'Re-enter password'}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-10 py-2.5 text-sm focus:border-[#6C4CE1] focus:ring-1 focus:ring-[#6C4CE1] outline-none transition-all shadow-sm"
                      />
                      {i === 0 && (
                        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={loading || hasSession === null}
                  className={`w-full bg-[#6C4CE1] hover:bg-[#5839C6] text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 mt-2 ${loading ? 'opacity-70' : ''}`}
                >
                  {loading ? 'Setting up…' : <>Activate account <ChevronRight className="h-4 w-4" /></>}
                </button>
              </form>

              <div className="flex items-center gap-1.5 mt-5 text-[11px] text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Your account is created by invitation — no public sign-up.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
