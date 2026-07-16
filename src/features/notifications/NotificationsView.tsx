import React from 'react';
import { Bell, Check, Clock, Shield, Sliders, AlertTriangle } from 'lucide-react';
import { Notification, UserRole } from '@/types';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  userRole: UserRole;
}

export default function NotificationsView({ 
  notifications, 
  onMarkRead, 
  onClearAll,
  userRole 
}: NotificationsViewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl max-w-3xl mx-auto overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-[#6C4CE1]" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Alerts & System Bulletins</h3>
        </div>
        {notifications.some(n => n.status === 'Unread') && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 cursor-pointer"
          >
            Clear all alerts
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No active alerts or reminders recorded in your workspace.
          </div>
        ) : (
          notifications.map((notif) => {
            const isUnread = notif.status === 'Unread';
            return (
              <div 
                key={notif.id} 
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  isUnread ? 'bg-[#6C4CE1]/10/20' : 'hover:bg-slate-50/30'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                    notif.type === 'Alert' ? 'bg-rose-50 text-rose-600' :
                    notif.type === 'Reminder' ? 'bg-amber-50 text-amber-600' :
                    'bg-[#6C4CE1]/10 text-[#2D1B69]'
                  }`}>
                    {notif.type === 'Alert' ? <AlertTriangle className="h-4.5 w-4.5" /> :
                     notif.type === 'Reminder' ? <Clock className="h-4.5 w-4.5" /> :
                     <Shield className="h-4.5 w-4.5" />}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs text-slate-700 leading-relaxed ${isUnread ? 'font-medium text-slate-900' : ''}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 tabular-nums block">
                      Issued: {notif.createdAt.replace('T', ' ')}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={() => onMarkRead(notif.id)}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[10px] font-semibold transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
