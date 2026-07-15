import React, { useState } from 'react';
import { UserRole, User } from '@/types';
import Logo from '@/components/ui/Logo';
import { Auth } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Mail, Lock, ChevronRight, Eye, EyeOff, User as UserIcon, ArrowLeft, AlertTriangle } from 'lucide-react';

interface AuthViewProps {
  initialRole?: string;
  onLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

const DEMO_EMAILS: Record<string, string> = {
  SHIP_AGENT: 'sarah@oneport.demo',
  PORT_AGENT: 'michael@oneport.demo',
  PROTECTIVE_AGENT: 'elena@oneport.demo',
};

export default function AuthView({ onLoginSuccess, onBack, initialRole }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  // Login State
  const [email, setEmail] = useState(DEMO_EMAILS[initialRole || ''] || 'sarah@oneport.demo');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>((initialRole as UserRole) || 'PORT_AGENT');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

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

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await Auth.signUp({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
      });
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans antialiased">
      {/* Left Panel */}
      <div className="lg:w-[45%] relative bg-[#F2EFFF] flex flex-col justify-between overflow-hidden hidden lg:flex border-r border-[#6C4CE1]/10">
        
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C4CE1] rounded-full   opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2D1B69] rounded-full   opacity-10"></div>
        
        <div className="relative z-10 p-10 lg:p-16 flex flex-col h-full justify-between">
          <Logo />
          
          <div className="my-20 lg:my-0">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 tracking-tight text-slate-900">
              Everything works <br/>better <span className="text-[#6C4CE1]">together.</span>
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

      {/* Right Panel - Login/Signup Form */}
      <div className="lg:w-[55%] bg-white flex flex-col p-6 lg:p-16 overflow-y-auto w-full relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors z-20"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-semibold">Back to Home</span>
          </button>
        )}
        <div className="flex-1 flex items-center justify-center w-full mt-12 lg:mt-0">
          <div className="w-full max-w-md bg-white">

          {!isSupabaseConfigured && (
            <div className="mb-6 flex items-start space-x-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Supabase isn't configured yet. Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in your <code className="font-mono">.env</code> file
                (see the <code className="font-mono">supabase/</code> folder for the schema to run against your project).
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start space-x-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div className="mb-8 text-center">
                <div className="lg:hidden flex justify-center mb-8"><Logo /></div>
                
                <h1 className="text-3xl font-bold text-slate-900">Let's Get Started</h1>
                <p className="text-slate-500 text-sm mt-2">Sign in to your agency workspace.</p>
              </div>

                            {/* Email / Password Form */}
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
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
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
              
              <div className="text-center mt-8 text-sm text-slate-600">
                New to the agency? <button type="button" onClick={() => setMode('signup')} className="text-[#6C4CE1] font-bold hover:underline underline-offset-2 border-b-0">Create an account</button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="lg:hidden flex justify-center mb-8"><Logo /></div>
                
                <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
                <p className="text-slate-500 text-sm mt-2">Register your operator profile below.</p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Legal Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setSignupName(newName);
                        if (newName.trim().length > 0) {
                          setSignupEmail(`${newName.trim().replace(/\s+/g, '').toLowerCase()}@oneport.demo`);
                        } else {
                          setSignupEmail('');
                        }
                      }}
                      placeholder="e.g. David Miller"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:border-[#6C4CE1] focus:ring-1 focus:ring-[#6C4CE1] outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      disabled
                      placeholder="Auto-generated"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-500 font-mono cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-10 py-2.5 text-sm focus:border-[#6C4CE1] focus:ring-1 focus:ring-[#6C4CE1] outline-none transition-all shadow-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Agent Role Category</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#6C4CE1] focus:ring-1 focus:ring-[#6C4CE1] shadow-sm appearance-none"
                  >
                    <option value="PORT_AGENT">Port Agent (In-Port Logistics)</option>
                    <option value="SHIP_AGENT">Ship Agent (Vessel Owners Rep)</option>
                    <option value="PROTECTIVE_AGENT">Protective Agent (OPA Auditors)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-[#6C4CE1] hover:bg-[#5839C6] text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center mt-6 shadow-[0_4px_14px_rgba(108,76,225,0.39)] ${isLoading ? 'opacity-70' : ''}`}
                >
                  {isLoading ? 'Registering...' : 'Create Account'} <ChevronRight className="ml-1.5 h-4 w-4" />
                </button>

                <div className="text-center mt-8 text-sm text-slate-600">
                  Already registered? <button type="button" onClick={() => setMode('login')} className="text-[#6C4CE1] font-bold hover:underline underline-offset-2 border-b-0">Sign in</button>
                </div>
              </form>
            </>
          )}

        </div>
        </div>
      </div>
    </div>
  );
}
