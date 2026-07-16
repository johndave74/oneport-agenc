import React, { useState } from 'react';
import { Shield, Users, Activity, UserCheck, Key } from 'lucide-react';
import { User, AuditLog, UserRole } from '@/types';

interface AdminViewProps {
  users: User[];
  auditLogs: AuditLog[];
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  initialTab?: 'users' | 'auditlogs';
}

export default function AdminView({ users, auditLogs, onUpdateUserRole, initialTab = 'users' }: AdminViewProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  if (initialTab === 'auditlogs') {
    return (
      <div className="text-xs">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2">
            <Activity className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security Audit Trails</h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto p-2">
            {auditLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No audit log entries recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50/50 rounded-lg space-y-1.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 block">{log.action}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{log.timestamp.replace('T', ' ')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    "{log.details}"
                  </p>
                  <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-mono font-medium">
                    <UserCheck className="h-3 w-3 text-slate-300" />
                    <span>Operator: {log.userName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">

      {/* Col 1 & 2: User Role Permissions Management */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* User management list */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4.5 w-4.5 text-[#6C4CE1]" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">User Directory & Roles</h3>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs"
            >
              Add Agency Operator
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Operator Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Active Authorization</th>
                <th className="py-2.5 px-4 text-right">Modify Role Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center font-mono shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      u.role === 'ADMIN' ? 'bg-slate-100 text-slate-800 border' :
                      u.role === 'PORT_AGENT' ? 'bg-[#6C4CE1]/10 text-[#2D1B69]' :
                      u.role === 'SHIP_AGENT' ? 'bg-[#6C4CE1]/10 text-[#2D1B69]' :
                      'bg-purple-50 text-purple-800'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                      className="border border-slate-200 rounded p-1 text-[10px] font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="PORT_AGENT">Port Agent</option>
                      <option value="SHIP_AGENT">Ship Agent</option>
                      <option value="PROTECTIVE_AGENT">Protective Agent</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permissions guidelines */}
        <div className="bg-white border border-slate-200 text-slate-700 p-5 rounded-xl space-y-4 shadow-sm">
          <h4 className="font-bold text-[#6C4CE1] uppercase tracking-wider text-[10px] font-mono flex items-center space-x-2">
            <Key className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <span>Role-Based Access Control (RBAC) Matrices</span>
          </h4>
          <div className="grid grid-cols-3 gap-4 text-[11px] leading-relaxed text-slate-600">
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Port Agents</span>
              <p className="text-slate-500">Can create vessels, modify pilot & tug tasks, record expenses under PDA.</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Ship Agents</span>
              <p className="text-slate-500">Can edit cargo details, track turnaround times, coordinate crew accommodation & checklists.</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Protective Agents</span>
              <p className="text-slate-500">Can audit PDA cost overruns, flag suspicious expenses, approve/reject cost items.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Col 3: Realtime Database Audit Trail Logs */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2">
            <Activity className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security Audit Trails</h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto p-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-50/50 rounded-lg space-y-1.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block">{log.action}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{log.timestamp.replace('T', ' ')}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  "{log.details}"
                </p>
                <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-mono font-medium">
                  <UserCheck className="h-3 w-3 text-slate-300" />
                  <span>Operator: {log.userName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Shield className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <span>Register New Agency Operator</span>
              </h4>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Operator accounts are backed by Supabase Auth, so an admin can't fabricate one directly —
                only the operator's own sign-up can create their login credentials securely.
              </p>
              <p>
                Ask the new operator to open the <strong>Sign In</strong> screen and choose{' '}
                <strong>"Create an account"</strong>. Once they register, their profile appears in the
                directory to the left, where you can assign their role.
              </p>
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
