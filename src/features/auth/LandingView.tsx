import React, { useState } from 'react';
import { motion } from 'motion/react';
import Logo from '@/components/ui/Logo';
import { PLANS, money } from '@/lib/billing/plans';
import {
  Anchor, CalendarRange, Timer, FileText, Wallet, Users, ShieldCheck, BarChart3,
  ArrowRight, Check, Menu, X, Ship, Building2, Globe, Lock,
} from 'lucide-react';

interface LandingViewProps {
  // role is legacy/unused — login is email + password (invitation-only).
  onLoginClick: (role?: string) => void;
  // Set when a session already exists: the landing shows "Welcome back" and the
  // primary CTA enters the workspace instead of opening the sign-in form.
  sessionUserName?: string | null;
  onEnterWorkspace?: () => void;
}

const DEMO_MAILTO = 'mailto:hello@oneport.example?subject=OnePort%20demo%20request';

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

// Scroll-triggered reveal wrapper: fades + rises once as the section enters view.
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

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

export default function LandingView({ onLoginClick, sessionUserName, onEnterWorkspace }: LandingViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const signIn = () => onLoginClick();
  const hasSession = !!sessionUserName && !!onEnterWorkspace;
  const primaryAction = hasSession ? onEnterWorkspace! : signIn;
  const primaryLabel = hasSession ? 'Enter your workspace' : 'Sign in';

  const plans = [
    { plan: PLANS.STARTER, highlight: false },
    { plan: PLANS.PROFESSIONAL, highlight: true },
    { plan: PLANS.ENTERPRISE, highlight: false },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* Nav */}
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100"
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#6C4CE1] transition-colors">Features</a>
            <a href="#roles" className="hover:text-[#6C4CE1] transition-colors">Who it's for</a>
            <a href="#pricing" className="hover:text-[#6C4CE1] transition-colors">Pricing</a>
            <a href="#security" className="hover:text-[#6C4CE1] transition-colors">Security</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {!hasSession && <a href={DEMO_MAILTO} className="text-sm font-semibold text-slate-600 hover:text-[#6C4CE1] transition-colors">Book a demo</a>}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={primaryAction}
              className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              {primaryLabel} {hasSession && <ArrowRight className="h-3.5 w-3.5" />}
            </motion.button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-600">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden border-t border-slate-100 px-5 py-4 space-y-3 text-sm font-semibold text-slate-600 overflow-hidden"
          >
            <a href="#features" onClick={() => setMenuOpen(false)} className="block">Features</a>
            <a href="#roles" onClick={() => setMenuOpen(false)} className="block">Who it's for</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block">Pricing</a>
            <button onClick={primaryAction} className="w-full bg-[#6C4CE1] text-white font-semibold px-4 py-2.5 rounded-lg mt-2">{primaryLabel}</button>
          </motion.div>
        )}
      </motion.header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F2EFFF] to-white" />
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 bg-[#6C4CE1]/15 rounded-full blur-3xl"
          animate={{ y: [0, -24, 0], x: [0, 14, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 -left-32 w-80 h-80 bg-[#2D1B69]/10 rounded-full blur-3xl"
          animate={{ y: [0, 22, 0], x: [0, -12, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-72 h-72 bg-violet-300/20 rounded-full blur-3xl"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
          <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C4CE1] bg-white border border-[#6C4CE1]/20 px-3 py-1 rounded-full shadow-sm">
            <motion.span animate={{ rotate: [0, 14, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="inline-flex">
              <Globe className="h-3.5 w-3.5" />
            </motion.span>
            {hasSession ? `Welcome back, ${sessionUserName!.split(' ')[0]}` : 'Global Maritime Operations Platform'}
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
            The operating system for<br />
            <span className="bg-gradient-to-r from-[#6C4CE1] via-[#8B6FF0] to-[#2D1B69] bg-clip-text text-transparent">maritime agencies</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Manage vessel operations, port calls, laytime, documentation and disbursements from one secure workspace — built for ship agents, port agents and protective agents.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 14px 34px rgba(108,76,225,0.45)' }}
              whileTap={{ scale: 0.97 }}
              onClick={primaryAction}
              className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-[0_8px_24px_rgba(108,76,225,0.35)] flex items-center gap-2"
            >
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </motion.button>
            {hasSession ? (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={signIn} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-6 py-3 rounded-xl transition-colors">
                Switch account
              </motion.button>
            ) : (
              <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href={DEMO_MAILTO} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-6 py-3 rounded-xl transition-colors">
                Book a demo
              </motion.a>
            )}
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 text-xs text-slate-400">14-day free trial · No credit card required · Invitation-based access</motion.p>

          <motion.div variants={stagger} className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { k: 'Multi-tenant', v: 'Isolated per agency' },
              { k: 'Role-based', v: 'Granular permissions' },
              { k: 'Laytime engine', v: 'Auto demurrage' },
              { k: 'Audit trail', v: 'Every action logged' },
            ].map((s) => (
              <motion.div
                key={s.k}
                variants={fadeUp}
                whileHover={{ y: -5, boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left"
              >
                <div className="text-sm font-bold text-slate-900">{s.k}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.v}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Everything a maritime agency runs on</h2>
          <p className="mt-3 text-slate-500">One platform for the entire port-call lifecycle — no spreadsheets, no silos.</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 14px 30px rgba(108,76,225,0.12)' }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-[#6C4CE1]/30 h-full"
                >
                  <span className="h-11 w-11 rounded-xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.body}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Who it's for */}
      <section id="roles" className="bg-[#F2EFFF]/60 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <Reveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Built for every maritime role</h2>
            <p className="mt-3 text-slate-500">Permissions — not job titles — decide what each user can do, so people can wear multiple hats.</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAPABILITIES.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={c.title} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
                    <span className="h-11 w-11 rounded-xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{c.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{c.body}</p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Live in minutes, not months</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.25 }} className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
                <span className="text-3xl font-bold text-[#6C4CE1]/25 tabular-nums">{s.n}</span>
                <h3 className="mt-2 text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <Reveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Simple, scalable pricing</h2>
            <p className="mt-3 text-slate-500">Start with a 14-day free trial. Upgrade as your agency grows.</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map(({ plan, highlight }, i) => (
              <Reveal key={plan.id} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl p-6 shadow-sm border ${highlight ? 'bg-[#2D1B69] text-white border-[#2D1B69] shadow-lg md:-translate-y-2' : 'bg-white border-slate-200'}`}
                >
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
                </motion.div>
              </Reveal>
            ))}
          </div>
          <Reveal><p className="text-center text-xs text-slate-400 mt-6">Need more? <a href={DEMO_MAILTO} className="text-[#6C4CE1] font-semibold">Talk to us about an Enterprise or Custom plan.</a></p></Reveal>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="max-w-6xl mx-auto px-5 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C4CE1]"><Lock className="h-3.5 w-3.5" /> Enterprise security</span>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">Your data, completely isolated</h2>
            <p className="mt-4 text-slate-500 leading-relaxed">Every organization runs in its own tenant. Row-level security enforces isolation at the database — one customer can never see another's vessels, port calls or finances. Access is controlled by granular, role-based permissions, and every sensitive action is written to an immutable audit log.</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Building2, t: 'Multi-tenant', d: 'Isolated per organization' },
              { icon: ShieldCheck, t: 'RBAC', d: 'Roles & permissions' },
              { icon: Lock, t: 'Row-level security', d: 'Enforced at the database' },
              { icon: Users, t: 'Invitation-only', d: 'No open sign-up' },
            ].map((x, i) => {
              const Icon = x.icon;
              return (
                <Reveal key={x.t} delay={i * 0.08}>
                  <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.25 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full">
                    <Icon className="h-6 w-6 text-[#6C4CE1]" />
                    <div className="mt-3 text-sm font-bold text-slate-900">{x.t}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{x.d}</div>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2D1B69] relative overflow-hidden">
        <motion.div
          className="absolute -top-20 right-10 w-72 h-72 bg-[#6C4CE1]/30 rounded-full blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative max-w-4xl mx-auto px-5 py-16 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-white tracking-tight">Ready to modernise your agency?</h2>
            <p className="mt-3 text-white/70">{hasSession ? 'Your workspace is ready and waiting.' : 'Sign in to your workspace, or book a demo to see OnePort in action.'}</p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={primaryAction} className="bg-white text-[#2D1B69] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </motion.button>
              {!hasSession && (
                <a href={DEMO_MAILTO} className="bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">Book a demo</a>
              )}
            </div>
          </Reveal>
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
            <button onClick={primaryAction} className="hover:text-[#6C4CE1] cursor-pointer">{primaryLabel}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
