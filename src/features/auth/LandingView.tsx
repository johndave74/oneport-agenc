import React, { useState } from 'react';
import Logo from '@/components/ui/Logo';
import { PLANS, money } from '@/lib/billing/plans';
import {
  Anchor, CalendarRange, Timer, FileText, Wallet, Users, ShieldCheck, BarChart3,
  ArrowRight, Check, Menu, X, Ship, Building2, Globe, Lock,
} from 'lucide-react';

interface LandingViewProps {
  // role is legacy/unused — login is email + password (invitation-only).
  onLoginClick: (role?: string) => void;
}

const DEMO_MAILTO = 'mailto:hello@oneport.example?subject=OnePort%20demo%20request';

const FEATURES = [
  { icon: Anchor, title: 'Port Calls & Voyages', body: 'Run every port call end-to-end — arrivals, berthing, cargo ops, departures — on one live board.' },
  { icon: CalendarRange, title: 'Planning Centre', body: 'A visual, multi-vessel schedule so operations managers see the whole day at a glance.' },
  { icon: Timer, title: 'Laytime & Demurrage', body: 'Statement-of-facts driven laytime engine with automatic demurrage and despatch calculations.' },
  { icon: FileText, title: 'Documents & SOF', body: 'A central document library, clearances and filings tied to each voyage.' },
  { icon: Wallet, title: 'Disbursements & Invoicing', body: 'PDA/FDA estimates vs actuals, approvals, tariffs and invoices in one commercial hub.' },
  { icon: BarChart3, title: 'Reports & Analytics', body: 'Executive dashboards for operations, finance and performance across your agency.' },
];

const CAPABILITIES = [
  { icon: Ship, title: 'Ship & Port Agents', body: 'Coordinate vessels, pilots, tugs, cargo and port authorities.' },
  { icon: ShieldCheck, title: 'Protective & Supervisory', body: 'Monitor port calls, review SOF/NOR, and approve disbursements on behalf of owners.' },
  { icon: Wallet, title: 'Finance & Operations', body: 'Manage PDA/FDA, invoices, tariffs and approvals with full audit trails.' },
];

const STEPS = [
  { n: '01', title: 'Onboard your organization', body: 'OnePort provisions an isolated, secure workspace for your agency in minutes.' },
  { n: '02', title: 'Invite your team', body: 'Your admin adds users and assigns roles — permissions decide what each person can do.' },
  { n: '03', title: 'Run operations', body: 'Create port calls, track laytime, and manage documents and disbursements from day one.' },
];

export default function LandingView({ onLoginClick }: LandingViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const signIn = () => onLoginClick();

  const plans = [
    { plan: PLANS.STARTER, highlight: false },
    { plan: PLANS.PROFESSIONAL, highlight: true },
    { plan: PLANS.ENTERPRISE, highlight: false },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#6C4CE1] transition-colors">Features</a>
            <a href="#roles" className="hover:text-[#6C4CE1] transition-colors">Who it's for</a>
            <a href="#pricing" className="hover:text-[#6C4CE1] transition-colors">Pricing</a>
            <a href="#security" className="hover:text-[#6C4CE1] transition-colors">Security</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <a href={DEMO_MAILTO} className="text-sm font-semibold text-slate-600 hover:text-[#6C4CE1] transition-colors">Book a demo</a>
            <button onClick={signIn} className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">Sign in</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-600">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 px-5 py-4 space-y-3 text-sm font-semibold text-slate-600">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block">Features</a>
            <a href="#roles" onClick={() => setMenuOpen(false)} className="block">Who it's for</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block">Pricing</a>
            <button onClick={signIn} className="w-full bg-[#6C4CE1] text-white font-semibold px-4 py-2.5 rounded-lg mt-2">Sign in</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F2EFFF] to-white" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#6C4CE1]/10 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C4CE1] bg-white border border-[#6C4CE1]/20 px-3 py-1 rounded-full shadow-sm">
            <Globe className="h-3.5 w-3.5" /> Global Maritime Operations Platform
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
            The operating system for<br /><span className="text-[#6C4CE1]">maritime agencies</span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Manage vessel operations, port calls, laytime, documentation and disbursements from one secure workspace — built for ship agents, port agents and protective agents.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={signIn} className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-[0_8px_24px_rgba(108,76,225,0.35)] flex items-center gap-2">
              Sign in <ArrowRight className="h-4 w-4" />
            </button>
            <a href={DEMO_MAILTO} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-6 py-3 rounded-xl transition-colors">Book a demo</a>
          </div>
          <p className="mt-4 text-xs text-slate-400">14-day free trial · No credit card required · Invitation-based access</p>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { k: 'Multi-tenant', v: 'Isolated per agency' },
              { k: 'Role-based', v: 'Granular permissions' },
              { k: 'Laytime engine', v: 'Auto demurrage' },
              { k: 'Audit trail', v: 'Every action logged' },
            ].map((s) => (
              <div key={s.k} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left">
                <div className="text-sm font-bold text-slate-900">{s.k}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Everything a maritime agency runs on</h2>
          <p className="mt-3 text-slate-500">One platform for the entire port-call lifecycle — no spreadsheets, no silos.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#6C4CE1]/30 transition-all">
                <span className="h-11 w-11 rounded-xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who it's for */}
      <section id="roles" className="bg-[#F2EFFF]/60 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Built for every maritime role</h2>
            <p className="mt-3 text-slate-500">Permissions — not job titles — decide what each user can do, so people can wear multiple hats.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <span className="h-11 w-11 rounded-xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Live in minutes, not months</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <span className="text-3xl font-bold text-[#6C4CE1]/25 tabular-nums">{s.n}</span>
              <h3 className="mt-2 text-base font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Simple, scalable pricing</h2>
            <p className="mt-3 text-slate-500">Start with a 14-day free trial. Upgrade as your agency grows.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map(({ plan, highlight }) => (
              <div key={plan.id} className={`rounded-2xl p-6 shadow-sm border ${highlight ? 'bg-[#2D1B69] text-white border-[#2D1B69] shadow-lg md:-translate-y-2' : 'bg-white border-slate-200'}`}>
                {highlight && <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white px-2 py-0.5 rounded-full mb-3">Most popular</span>}
                <h3 className={`text-lg font-bold ${highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold tabular-nums ${highlight ? 'text-white' : 'text-slate-900'}`}>{money(plan.priceMonthly)}</span>
                  <span className={`text-sm ${highlight ? 'text-white/60' : 'text-slate-400'}`}>/mo</span>
                </div>
                <p className={`mt-2 text-sm ${highlight ? 'text-white/70' : 'text-slate-500'}`}>{plan.blurb}</p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  <li className={`flex items-center gap-2 ${highlight ? 'text-white/90' : 'text-slate-600'}`}><Check className="h-4 w-4 shrink-0 text-emerald-400" /> {plan.maxUsers ? `Up to ${plan.maxUsers} users` : 'Unlimited users'}</li>
                  <li className={`flex items-center gap-2 ${highlight ? 'text-white/90' : 'text-slate-600'}`}><Check className="h-4 w-4 shrink-0 text-emerald-400" /> {plan.modules ? `${plan.modules.length} operational modules` : 'All modules included'}</li>
                  <li className={`flex items-center gap-2 ${highlight ? 'text-white/90' : 'text-slate-600'}`}><Check className="h-4 w-4 shrink-0 text-emerald-400" /> Isolated, secure workspace</li>
                  <li className={`flex items-center gap-2 ${highlight ? 'text-white/90' : 'text-slate-600'}`}><Check className="h-4 w-4 shrink-0 text-emerald-400" /> Full audit trail</li>
                </ul>
                <a href={DEMO_MAILTO} className={`mt-6 block text-center font-semibold py-2.5 rounded-xl transition-colors ${highlight ? 'bg-white text-[#2D1B69] hover:bg-white/90' : 'bg-[#6C4CE1] text-white hover:bg-[#5839C6]'}`}>Get started</a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">Need more? <a href={DEMO_MAILTO} className="text-[#6C4CE1] font-semibold">Talk to us about an Enterprise or Custom plan.</a></p>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="max-w-6xl mx-auto px-5 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C4CE1]"><Lock className="h-3.5 w-3.5" /> Enterprise security</span>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">Your data, completely isolated</h2>
            <p className="mt-4 text-slate-500 leading-relaxed">Every organization runs in its own tenant. Row-level security enforces isolation at the database — one customer can never see another's vessels, port calls or finances. Access is controlled by granular, role-based permissions, and every sensitive action is written to an immutable audit log.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Building2, t: 'Multi-tenant', d: 'Isolated per organization' },
              { icon: ShieldCheck, t: 'RBAC', d: 'Roles & permissions' },
              { icon: Lock, t: 'Row-level security', d: 'Enforced at the database' },
              { icon: Users, t: 'Invitation-only', d: 'No open sign-up' },
            ].map((x) => {
              const Icon = x.icon;
              return (
                <div key={x.t} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <Icon className="h-6 w-6 text-[#6C4CE1]" />
                  <div className="mt-3 text-sm font-bold text-slate-900">{x.t}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{x.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2D1B69]">
        <div className="max-w-4xl mx-auto px-5 py-16 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Ready to modernise your agency?</h2>
          <p className="mt-3 text-white/70">Sign in to your workspace, or book a demo to see OnePort in action.</p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={signIn} className="bg-white text-[#2D1B69] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></button>
            <a href={DEMO_MAILTO} className="bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">Book a demo</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OnePort — Global Maritime Operations Platform. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
            <a href="#features" className="hover:text-[#6C4CE1]">Features</a>
            <a href="#pricing" className="hover:text-[#6C4CE1]">Pricing</a>
            <button onClick={signIn} className="hover:text-[#6C4CE1]">Sign in</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
