import React, { useState } from 'react';
import Logo from '@/components/ui/Logo';
import {
  LayoutDashboard,
  Ship,
  Compass,
  CheckSquare,
  FileText,
  DollarSign,
  MessageSquare,
  BarChart2,
  Bell,
  Settings,
  ShieldAlert,
  LogOut,
  UserCheck,
  Calculator,
  Users,
  Calendar,
  Handshake,
  Receipt,
  FileStack,
  Building2,
  Activity,
  ChevronDown,
  Globe,
  LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/types';
import { Permission, navFromPermissions, can, ModuleId } from '@/lib/rbac/permissions';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: UserRole;
  userName: string;
  permissions: Set<Permission>;
  isPlatformAdmin?: boolean;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  PORT_AGENT: 'Port Agent',
  SHIP_AGENT: 'Ship Agent',
  PROTECTIVE_AGENT: 'Protective Agent',
  ADMIN: 'System Admin',
  PLATFORM_SUPER_ADMIN: 'Platform Admin',
  ORG_ADMIN: 'Organization Admin',
  OPERATIONS_MANAGER: 'Operations Manager',
  FINANCE: 'Finance Officer',
  DOCUMENTATION: 'Documentation Officer',
  VIEWER: 'Viewer',
};

// Icons per router view id (nav is now built from permissions, not hardcoded).
const VIEW_ICON: Record<string, LucideIcon> = {
  voyages: Compass,
  planning: Calendar,
  vessels: Ship,
  tasks: CheckSquare,
  expenses: DollarSign,
  invoices: FileStack,
  tariffs: Receipt,
  approvals: CheckSquare,
  laytime: Calculator,
  crew: Users,
  documents: FileText,
  crm: UserCheck,
  partners: Handshake,
  messages: MessageSquare,
  reports: BarChart2,
  admin: ShieldAlert,
  company: Building2,
  auditlogs: Activity,
};

export default function Sidebar({ currentView, setView, userRole, userName, permissions, isPlatformAdmin = false, onLogout, isOpen = false, onClose }: SidebarProps) {
  const handleItemClick = (viewId: string) => {
    setView(viewId);
    if (onClose) onClose();
  };

  const groups = navFromPermissions(permissions);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (title: string) => setCollapsed((c) => ({ ...c, [title]: !c[title] }));

  const itemClasses = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 text-left ${
      active ? 'bg-[#6C4CE1] text-white shadow-sm shadow-[#6C4CE1]/20' : 'text-slate-500 hover:bg-[#F2EFFF] hover:text-[#6C4CE1]'
    }`;

  const renderItem = (item: { view: string; label: string }, Icon: LucideIcon) => {
    const active = currentView === item.view;
    return (
      <button key={item.view + item.label} onClick={() => handleItemClick(item.view)} className={itemClasses(active)}>
        <span className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
          <span className="truncate">{item.label}</span>
        </span>
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
        {/* Brand */}
        <div className="px-4 h-16 border-b border-slate-200 flex items-center justify-between shrink-0">
          <Logo />
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-[#6C4CE1] hover:bg-[#F2EFFF] rounded-lg border border-slate-200 cursor-pointer" title="Close menu">
              ✕
            </button>
          )}
        </div>

        {/* User */}
        <div className="px-4 py-3 bg-[#F2EFFF] border-b border-slate-200 flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-full bg-[#6C4CE1]/10 border border-[#6C4CE1]/20 flex items-center justify-center text-[#6C4CE1] font-bold text-xs shrink-0">
            {userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{userName}</p>
            <span className="text-[10px] text-[#6C4CE1] font-semibold uppercase tracking-wider">{ROLE_LABELS[userRole] || userRole}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {can(permissions, 'dashboard', 'view') && (
            <button onClick={() => handleItemClick('dashboard')} className={itemClasses(currentView === 'dashboard')}>
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className={`h-4 w-4 shrink-0 ${currentView === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Dashboard</span>
              </span>
            </button>
          )}

          {groups.map((group) => {
            const hasActive = group.items.some((i) => i.view === currentView);
            const isCollapsed = collapsed[group.title] && !hasActive;
            return (
              <div key={group.title} className="pt-2">
                <button onClick={() => toggle(group.title)} className="w-full flex items-center justify-between px-3 py-1 group cursor-pointer">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{group.title}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {!isCollapsed && <div className="space-y-0.5 mt-1">{group.items.map((item) => renderItem(item, VIEW_ICON[item.view] || Compass))}</div>}
              </div>
            );
          })}

          {/* Platform (super-admin only) — kept low, near the bottom */}
          {isPlatformAdmin && (
            <div className="pt-2">
              <span className="block px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Platform</span>
              <div className="space-y-0.5 mt-1">
                {renderItem({ view: 'organizations', label: 'Organizations' }, Globe)}
              </div>
            </div>
          )}

          {/* Account */}
          {(can(permissions, 'notifications', 'view') || can(permissions, 'settings', 'view')) && (
            <div className="pt-2">
              <span className="block px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Account</span>
              <div className="space-y-0.5 mt-1">
                {can(permissions, 'notifications', 'view') && (
                  <button onClick={() => handleItemClick('notifications')} className={itemClasses(currentView === 'notifications')}>
                    <span className="flex items-center gap-2.5">
                      <Bell className={`h-4 w-4 shrink-0 ${currentView === 'notifications' ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">Notifications</span>
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${currentView === 'notifications' ? 'bg-white' : 'bg-rose-500 animate-pulse'}`} />
                  </button>
                )}
                {can(permissions, 'settings', 'view') && renderItem({ view: 'settings', label: 'Settings' }, Settings)}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 shrink-0">
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left">
            <LogOut className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
