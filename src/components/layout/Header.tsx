import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Clock, Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
import { UserRole, Notification } from '@/types';

interface OpsSummary {
  shipsAtBerth: number;
  criticalAlerts: number;
  status: 'green' | 'amber' | 'red';
}

interface HeaderProps {
  currentView: string;
  userRole: UserRole;
  userName: string;
  notifications: Notification[];
  onMarkAllRead: () => void;
  orgName: string;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  setView?: (view: string) => void;
  onOpenCommandPalette?: () => void;
  opsSummary?: OpsSummary;
}

const ROLE_LABELS: Record<UserRole, string> = {
  PORT_AGENT: 'Port Agent',
  SHIP_AGENT: 'Ship Agent',
  PROTECTIVE_AGENT: 'Protective Agent',
  ADMIN: 'System Admin'
};

export default function Header({
  currentView,
  userRole,
  userName,
  notifications,
  onMarkAllRead,
  orgName,
  onToggleSidebar,
  onLogout,
  setView,
  onOpenCommandPalette,
  opsSummary
}: HeaderProps) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [localTime, setLocalTime] = useState('');

  // Format titles nicely
  const titles: Record<string, string> = {
    dashboard: 'Operational Command Centre',
    planning: 'Planning Centre',
    vessels: 'Vessel Registry & Status',
    voyages: 'Port Call Operations & Timelines',
    tasks: 'Daily Tasks & Port Coordination',
    crew: 'Crew Management',
    documents: 'Document Clearance & Filing',
    crm: 'Agent Directory',
    partners: 'Partner Directory',
    expenses: 'Disbursements & Expense Audits',
    invoices: 'Invoices',
    tariffs: 'Tariffs & Rate Card',
    approvals: 'Approvals Inbox',
    laytime: 'Laytime & Demurrage Ledger',
    messages: 'Port Call Communications',
    reports: 'Reports & Analytics',
    notifications: 'Notifications',
    settings: 'Agency Settings & Profile',
    company: 'Company Details',
    admin: 'Users, Roles & Audit Trail',
    auditlogs: 'Security Audit Trail'
  };

  // Map views to multi-level breadcrumbs
  const breadcrumbs: Record<string, string[]> = {
    dashboard: ['Oneport Agenc', 'Dashboard'],
    planning: ['Operations', 'Planning Centre'],
    vessels: ['Operations', 'Vessels'],
    voyages: ['Operations', 'Port Calls'],
    tasks: ['Operations', 'Tasks'],
    crew: ['Operations', 'Crew Management'],
    documents: ['Documents & Partners', 'Documents'],
    crm: ['Documents & Partners', 'Agents'],
    partners: ['Documents & Partners', 'Partners'],
    expenses: ['Commercial', 'Disbursements'],
    invoices: ['Commercial', 'Invoices'],
    tariffs: ['Commercial', 'Tariffs'],
    approvals: ['Commercial', 'Approvals'],
    laytime: ['Maritime Operations', 'Laytime & Demurrage'],
    messages: ['Documents & Partners', 'Communications'],
    reports: ['Reports & Analytics', 'Reports & Analytics'],
    notifications: ['Account', 'Notifications'],
    settings: ['Account', 'Settings'],
    company: ['Account', 'Company'],
    admin: ['Administration', 'Users & Roles'],
    auditlogs: ['Administration', 'Audit Logs']
  };

  const currentPath = breadcrumbs[currentView] || ['Oneport Agenc', currentView];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
      setLocalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-[#F4F7F9] border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.01)] select-none gap-4">
      {/* Vantus Breadcrumb Style with Mobile Menu Toggle */}
      <div className="flex items-center space-x-3.5 min-w-0 shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg border border-slate-300 lg:hidden transition-colors cursor-pointer shrink-0"
            title="Open main navigation menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <h2 className="text-xs md:text-sm font-semibold text-slate-900 tracking-tight leading-none capitalize truncate max-w-[130px] sm:max-w-[280px]">
            {titles[currentView] || currentView}
          </h2>
          <div className="flex items-center space-x-1 text-[9px] md:text-[10px] text-slate-400 font-semibold font-sans tracking-tight uppercase mt-1 truncate">
            {currentPath.map((node, index) => (
              <React.Fragment key={node}>
                {index > 0 && <span className="text-slate-300 font-normal">/</span>}
                <span className={index === currentPath.length - 1 ? 'text-[#6C4CE1]' : 'text-slate-400'}>
                  {node}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Command Palette trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-2xl">
        <button
          onClick={() => onOpenCommandPalette?.()}
          className="relative w-full text-left cursor-pointer"
        >
          <input
            type="text"
            readOnly
            placeholder="Search port calls, vessels, tasks, documents, expenses..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-14 py-2 text-xs text-slate-600 placeholder-slate-400 focus:outline-none focus:border-[#6C4CE1] transition-all font-sans cursor-pointer"
          />
          <span className="absolute right-2.5 top-2 text-[10px] font-sans font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1 rounded">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right Side Utility Panel */}
      <div className="flex items-center space-x-3 shrink-0">

        {/* Port Time Indicators */}
        <div className="hidden lg:flex items-center space-x-3 bg-white border border-slate-150 rounded-lg px-3 py-1.5 text-[11px] font-sans font-semibold">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="uppercase text-[9px] tracking-wider text-slate-400">Local:</span>
            <span className="text-slate-700">{localTime}</span>
          </div>
          <span className="text-slate-200">|</span>
          <div className="flex items-center space-x-1 text-slate-500">
            <span className="uppercase text-[9px] tracking-wider text-slate-400">UTC:</span>
            <span className="text-slate-700">
              {utcTime.split(' ')[4] || '00:00:00'}
            </span>
          </div>

          {opsSummary && (
            <>
              <span className="text-slate-200">|</span>
              <div className="flex items-center space-x-1.5 text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  opsSummary.status === 'red' ? 'bg-rose-500 animate-pulse' :
                  opsSummary.status === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <span className="uppercase text-[9px] tracking-wider text-slate-400">Ops:</span>
                <span className="text-slate-700">{opsSummary.shipsAtBerth} in port · {opsSummary.criticalAlerts} alerts</span>
              </div>
            </>
          )}
        </div>

        {/* Live Radio & Chat shortcut */}
        <button
          onClick={() => setView?.('messages')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          title="Live Radio & Chat"
        >
          <MessageSquare className="h-4.5 w-4.5" />
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg border border-slate-300 transition-colors relative cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full text-white font-semibold flex items-center justify-center animate-pulse">
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2.5 w-80 bg-[#F4F7F9] border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-[#EBE5FF]">
                <h4 className="text-xs font-sans font-semibold tracking-widest text-slate-600">Operational Alerts</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkAllRead();
                      setShowNotifMenu(false);
                    }}
                    className="text-xs font-semibold text-[#2D1B69] hover:text-[#6B5A42]"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active alerts or reminders.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 text-xs transition-colors ${notif.status === 'Unread' ? 'bg-[#6C4CE1]/5 font-semibold' : 'hover:bg-slate-200/50'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold font-sans ${
                          notif.type === 'Alert' ? 'bg-rose-100 text-rose-700' :
                          notif.type === 'Reminder' ? 'bg-amber-100 text-amber-700' :
                          'bg-[#6C4CE1]/20 text-[#2D1B69]'
                        }`}>
                          {notif.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {notif.createdAt.replace('T', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-normal font-sans text-[11px]">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-200 bg-[#EBE5FF] text-center">
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                >
                  Dismiss Overlay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Organization display */}
        <div className="hidden xl:flex flex-col items-end pl-1 pr-2 border-l border-slate-200 leading-tight">
          <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{orgName || 'Oneport Agenc'}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">Organization</span>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-[#6C4CE1]/10 border border-[#6C4CE1]/20 flex items-center justify-center text-[#6C4CE1] font-black text-xs shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">{userName}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">{ROLE_LABELS[userRole]}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 block truncate">{userName}</span>
                <span className="text-[10px] text-slate-400">{ROLE_LABELS[userRole]}</span>
              </div>
              <button
                onClick={() => { setView?.('settings'); setShowProfileMenu(false); }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span>Global Settings</span>
              </button>
              <button
                onClick={() => { onLogout?.(); setShowProfileMenu(false); }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Terminate Session</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
