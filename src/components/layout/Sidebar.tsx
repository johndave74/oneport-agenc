import React from 'react';
import Logo from '@/components/ui/Logo';
import { 
  Waves, 
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
  Calendar
} from 'lucide-react';
import { UserRole, ROLE_ALLOWED_VIEWS } from '@/types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentView, setView, userRole, userName, onLogout, isOpen = false, onClose }: SidebarProps) {
  const roleLabels: Record<UserRole, string> = {
    PORT_AGENT: 'Port Agent',
    SHIP_AGENT: 'Ship Agent',
    PROTECTIVE_AGENT: 'Protective Agent',
    ADMIN: 'System Admin'
  };

  const handleItemClick = (viewId: string) => {
    setView(viewId);
    if (onClose) onClose();
  };

  // Grouped menu structure, organized around how maritime agents actually work:
  // Port Calls first among operational records, commercial/maritime-ops split
  // out, and only groups/items that map to a real page are shown.
  const rawGroups = [
    {
      title: "Operations",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'planning', label: 'Planning Centre', icon: Calendar },
        { id: 'voyages', label: 'Port Calls', icon: Compass },
        { id: 'vessels', label: 'Vessels', icon: Ship },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      ]
    },
    {
      title: "Commercial",
      items: [
        { id: 'expenses', label: 'Disbursements (PDA · FDA)', icon: DollarSign },
      ]
    },
    {
      title: "Maritime Operations",
      items: [
        { id: 'laytime', label: 'Laytime & Demurrage', icon: Calculator },
      ]
    },
    {
      title: "Documents & Partners",
      items: [
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'crm', label: 'Partners', icon: Users },
        { id: 'messages', label: 'Communications', icon: MessageSquare },
      ]
    },
    {
      title: "Reports & Analytics",
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
      ]
    }
  ];

  const allowedViews = ROLE_ALLOWED_VIEWS[userRole] || [];
  const groups = rawGroups.map(group => ({
    ...group,
    items: group.items.filter(item => allowedViews.includes(item.id))
  })).filter(group => group.items.length > 0);

  const adminItem = { id: 'admin', label: 'Users & Roles', icon: ShieldAlert };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Panel - Slide Out on Mobile, Sticky on Desktop */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white text-slate-600 flex flex-col border-r border-slate-200 h-screen z-50 shadow-[2px_0_8px_rgba(0,0,0,0.02)] select-none transition-transform duration-300 ease-in-out font-sans lg:translate-x-0 lg:sticky lg:top-0 lg:flex ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header - Sleek Vantus style */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <Logo />
          {/* Close button inside sidebar on mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-[#6C4CE1] hover:bg-[#F2EFFF] rounded-lg border border-slate-200 cursor-pointer"
              title="Close Menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* User Profile Card - Beautiful premium layout */}
        <div className="p-4 bg-[#F2EFFF] border-b border-slate-200 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-[#6C4CE1]/10 border border-[#6C4CE1]/20 flex items-center justify-center text-[#6C4CE1] font-black text-xs">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{userName}</p>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="inline-block h-1.5 w-1.5 bg-[#6C4CE1] rounded-full"></span>
              <span className="text-[10px] text-[#6C4CE1] font-mono font-bold truncate uppercase tracking-wider">
                {roleLabels[userRole]}
              </span>
            </div>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 px-3 py-5 space-y-5 overflow-y-auto bg-white">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <span className="px-3 text-[9px] font-black uppercase text-slate-500 tracking-widest font-mono block">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 text-left ${
                        isActive 
                          ? 'bg-[#6C4CE1] text-white shadow-sm shadow-[#6C4CE1]/20' 
                          : 'text-slate-500 hover:bg-[#F2EFFF] hover:text-[#6C4CE1]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.id === 'notifications' && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500 animate-pulse'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Administration group (ADMIN role only) */}
          {userRole === 'ADMIN' && (
            <div className="space-y-1.5">
              <span className="px-3 text-[9px] font-black uppercase text-slate-500 tracking-widest font-mono block">
                Administration
              </span>
              <button
                onClick={() => handleItemClick(adminItem.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 text-left ${
                  currentView === adminItem.id
                    ? 'bg-[#6C4CE1] text-white shadow-sm shadow-[#6C4CE1]/20'
                    : 'text-slate-500 hover:bg-[#F2EFFF] hover:text-[#6C4CE1]'
                }`}
              >
                <adminItem.icon className={`h-4 w-4 shrink-0 ${currentView === adminItem.id ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{adminItem.label}</span>
              </button>
            </div>
          )}

          {/* Account: Notifications + Settings */}
          <div className="space-y-1.5">
            <span className="px-3 text-[9px] font-black uppercase text-slate-500 tracking-widest font-mono block">
              Account
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => handleItemClick('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 text-left ${
                  currentView === 'notifications'
                    ? 'bg-[#6C4CE1] text-white shadow-sm shadow-[#6C4CE1]/20'
                    : 'text-slate-500 hover:bg-[#F2EFFF] hover:text-[#6C4CE1]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Bell className={`h-4 w-4 shrink-0 ${currentView === 'notifications' ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">Notifications</span>
                </div>
                <span className={`h-1.5 w-1.5 rounded-full ${currentView === 'notifications' ? 'bg-white' : 'bg-rose-500 animate-pulse'}`} />
              </button>
              <button
                onClick={() => handleItemClick('settings')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 text-left ${
                  currentView === 'settings'
                    ? 'bg-[#6C4CE1] text-white shadow-sm shadow-[#6C4CE1]/20'
                    : 'text-slate-500 hover:bg-[#F2EFFF] hover:text-[#6C4CE1]'
                }`}
              >
                <Settings className={`h-4 w-4 shrink-0 ${currentView === 'settings' ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 bg-slate-50 border-t border-[#6C4CE1]/20">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left"
          >
            <LogOut className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
