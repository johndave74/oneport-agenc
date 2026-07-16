import React, { useState } from 'react';
import { User } from '@/types';
import Logo from '@/components/ui/Logo';
import { Auth } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Mail, Lock, ChevronRight, Eye, EyeOff, ArrowLeft, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AuthViewProps {
  initialRole?: string;
  onLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export default function AuthView({ onLoginSuccess, onBack }: AuthViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await Auth.signIn(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans antialiased">
      {/* Left Panel */}
      <div className="lg:w-[45%] relative bg-[#F2EFFF] flex-col justify-between overflow-hidden hidden lg:flex border-r border-[#6C4CE1]/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C4CE1] rounded-full opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2D1B69] rounded-full opacity-10" />
        <div className="relative z-10 p-10 lg:p-16 flex flex-col h-full justify-between">
          <Logo />
          <div className="my-20 lg:my-0">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 tracking-tight text-slate-900">
              Everything works <br />better <span className="text-[#6C4CE1]">together.</span>
            </h1>
            <p className="text-slate-600 text-lg font-body leading-relaxed max-w-sm">
              A single, refined workspace for maritime agents to coordinate vessels, cargo, finances, and clearances with seamless precision.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-200">
            <div>
              <div className="text-2xl font-serif font-bold text-slate-900 mb-1">1,240+</div>
              <div className="text-[10px] uppercase tracking-wider text-[#6C4CE1] font-bold">Turnarounds</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-slate-900 mb-1">98%</div>
              <div className="text-[10px] uppercase tracking-wider text-[#6C4CE1] font-bold">On-Time Dispatch</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-slate-900 mb-1">24/7</div>
              <div className="text-[10px] uppercase tracking-wider text-[#6C4CE1] font-bold">Global Coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Sign in only */}
      <div className="lg:w-[55%] bg-white flex flex-col p-6 lg:p-16 overflow-y-auto w-full relative">
        {onBack && (
          <button onClick={onBack} className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors z-20">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-semibold">Back to Home</span>
          </button>
        )}
        <div className="flex-1 flex items-center justify-center w-full mt-12 lg:mt-0">
          <div className="w-full max-w-md">
            {!isSupabaseConfigured && (
              <div className="mb-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Supabase isn't configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code>.</span>
              </div>
            )}
            {error && (
              <div className="mb-6 flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-8 text-center">
              <div className="lg:hidden flex justify-center mb-8"><Logo /></div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
              <p className="text-slate-500 text-sm mt-2">Sign in to your agency workspace.</p>
            </div>

            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:border-[#6C4CE1] focus:ring-1 focus:ring-[#6C4CE1] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-10 py-2.5 text-sm focus:border-[#6C4CE1] focus:ring-1 focus:ring-[#6C4CE1] outline-none transition-all shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-[#6C4CE1] focus:ring-[#6C4CE1]" defaultChecked />
                  <span className="text-slate-600 font-medium">Remember me</span>
                </label>
                <button type="button" className="text-[#6C4CE1] font-bold hover:underline">Forgot password?</button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#6C4CE1] hover:bg-[#5839C6] text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center mt-6 shadow-[0_4px_14px_rgba(108,76,225,0.39)] ${isLoading ? 'opacity-70' : ''}`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'} <ChevronRight className="ml-1.5 h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-[#6C4CE1]" />
              <span>Accounts are created by invitation only. Contact your organization admin to be invited — you'll receive an email to set your password.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
