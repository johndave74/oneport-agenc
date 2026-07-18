import React from 'react';
import Logo from '@/components/ui/Logo';
import {
  LayoutDashboard,
  Globe,
  ShieldCheck,
  UserCog,
  Users,
  Activity,
  KeyRound,
  Server,
  Database,
  HardDrive,
  CreditCard,
  LineChart,
  Flag,
  Gauge,
  Settings,
  LogOut,
  LucideIcon,
} from 'lucide-react';

interface PlatformSidebarProps {
  currentView: string;
  setView: (view: string) => void;
  userName: string;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface Item { view: string; label: string; icon: LucideIcon; }
interface Group { title: string; items: Item[]; }

const GROUPS: Group[] = [
  {
    title: 'Platform',
    items: [
      { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { view: 'platform-team', label: 'Platform Team', icon: UserCog },
      { view: 'organizations', label: 'Organizations', icon: Globe },
      { view: 'orgusers', label: 'Organization Users', icon: Users },
    ],
  },
  {
    title: 'Access & Audit',
    items: [
      { view: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
      { view: 'auditlogs', label: 'Audit Logs', icon: Activity },
    ],
  },
  {
    title: 'Growth',
    items: [
      { view: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
      { view: 'analytics', label: 'Platform Analytics', icon: LineChart },
      { view: 'billing', label: 'Billing', icon: CreditCard },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { view: 'svc-auth', label: 'Authentication', icon: KeyRound },
      { view: 'svc-api', label: 'API & Edge Functions', icon: Server },
      { view: 'svc-db', label: 'Database', icon: Database },
      { view: 'svc-storage', label: 'Storage', icon: HardDrive },
      { view: 'feature-flags', label: 'Feature Flags', icon: Flag },
      { view: 'system-health', label: 'System Health', icon: Gauge },
    ],
  },
  {
    title: 'Account',
    items: [
      { view: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function PlatformSidebar({ currentView, setView, userName, onLogout, isOpen = false, onClose }: PlatformSidebarProps) {
  const go = (v: string) => { setView(v); if (onClose) onClose(); };

  const itemClass = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 text-left ${
      active ? 'bg-[#6C4CE1] text-white shadow-sm shadow-[#6C4CE1]/20' : 'text-slate-500 hover:bg-[#F2EFFF] hover:text-[#6C4CE1]'
    }`;

  const render = (item: Item) => {
    const Icon = item.icon;
    const active = currentView === item.view;
    return (
      <button key={item.view} onClick={() => go(item.view)} className={itemClass(active)}>
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50 lg:hidden transition-opacity duration-300" />}
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-white text-slate-600 flex flex-col border-r border-slate-200 h-screen z-50 shadow-[2px_0_8px_rgba(0,0,0,0.02)] select-none transition-transform duration-300 ease-in-out font-sans lg:translate-x-0 lg:sticky lg:top-0 lg:flex ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 h-16 border-b border-slate-200 flex items-center justify-between shrink-0">
          <Logo />
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-[#6C4CE1] hover:bg-[#F2EFFF] rounded-lg border border-slate-200 cursor-pointer" title="Close menu">✕</button>
          )}
        </div>

        <div className="px-4 py-3 bg-[#F2EFFF] border-b border-slate-200 flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-full bg-[#6C4CE1]/10 border border-[#6C4CE1]/20 flex items-center justify-center text-[#6C4CE1] font-bold text-xs shrink-0">
            {userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{userName}</p>
            <span className="text-[10px] text-[#6C4CE1] font-semibold uppercase tracking-wider">Platform Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <span className="block px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">{group.title}</span>
              <div className="space-y-0.5 mt-1">{group.items.map(render)}</div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 shrink-0">
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left">
            <LogOut className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
