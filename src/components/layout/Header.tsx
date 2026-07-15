import React, { useState, useEffect } from 'react';
import { Bell, Shield, Calendar, Clock, Anchor, Settings, Menu } from 'lucide-react';
import { UserRole, Notification } from '@/types';

interface OpsSummary {
  shipsAtBerth: number;
  criticalAlerts: number;
  status: 'green' | 'amber' | 'red';
}

interface HeaderProps {
  currentView: string;
  userRole: UserRole;

  notifications: Notification[];
  onMarkAllRead: () => void;
  orgName: string;
  onToggleSidebar?: () => void;
  opsSummary?: OpsSummary;
}

export default function Header({
  currentView,
  userRole,

  notifications,
  onMarkAllRead,
  orgName,
  onToggleSidebar,
  opsSummary
}: HeaderProps) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [localTime, setLocalTime] = useState('');

  // Format titles nicely
  const titles: Record<string, string> = {
    dashboard: 'Operational Command Centre',
    vessels: 'Vessel Registry & Status',
    voyages: 'Voyage Logistics & Timelines',
    tasks: 'Daily Tasks & Port Coordination',
    documents: 'Document Clearance & Filing',
    expenses: 'Disbursements & Expense Audits',
    messages: 'Voyage Collaboration Room',
    reports: 'Operational Intelligence & Port Reports',
    notifications: 'Alert Center & System Logs',
    settings: 'Agency Settings & Profile',
    admin: 'System Settings & Audit Trail'
  };

  // Map views to beautiful multi-level breadcrumbs
  const breadcrumbs: Record<string, string[]> = {
    dashboard: ['Oneport Agenc', 'Dashboard Center'],
    vessels: ['Operations & Tracking', 'Vessel Registry'],
    voyages: ['Operations & Tracking', 'Voyage Logistics'],
    tasks: ['Work & Dispatch', 'Service Tasks'],
    documents: ['Work & Dispatch', 'Digital Folders'],
    expenses: ['Financial Control', 'Disbursement Accounts'],
    laytime: ['Financial Control', 'Laytime Ledger'],
    messages: ['Hub Channels', 'Live Radio & Chat'],
    reports: ['Hub Channels', 'Intelligence Reports'],
    notifications: ['Hub Channels', 'System Alerts'],
    settings: ['Preferences', 'Global Settings'],
    admin: ['Governance', 'System Governance']
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

  return (
    <header className="h-16 bg-[#F4F7F9] border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.01)] select-none">
      {/* Vantus Breadcrumb Style with Mobile Menu Toggle */}
      <div className="flex items-center space-x-3.5 min-w-0">
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

      {/* Center Integrated Search (Non-functional elegant UI mockup like mockups) */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search transactions, vessels, records..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-600 placeholder-slate-400 focus:outline-none focus:border-[#6C4CE1] transition-all font-sans"
          />
          <span className="absolute right-2.5 top-2 text-[10px] font-sans font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1 rounded">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right Side Utility Panel */}
      <div className="flex items-center space-x-4">
        
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



        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg border border-slate-300 transition-colors relative"
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

      </div>
    </header>
  );
}
