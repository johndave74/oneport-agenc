import React, { useState } from 'react';
import { User, Shield, Save, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/types';

interface SettingsViewProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  onUpdateProfile: (name: string, email: string) => void;
}

export default function SettingsView({
  userName,
  userEmail,
  userRole,
  onUpdateProfile
}: SettingsViewProps) {
  const [profileName, setProfileName] = useState(userName);
  const [profileEmail, setProfileEmail] = useState(userEmail);
  const [showSuccess, setShowSuccess] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    PORT_AGENT: 'Port Agent',
    SHIP_AGENT: 'Ship Agent',
    PROTECTIVE_AGENT: 'Protective Agent',
    ADMIN: 'System Admin'
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileName, profileEmail);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
          <span>Profile configuration saved and synced across agency workspace logs.</span>
        </div>
      )}

      <div className="text-xs">

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wide border-b pb-3">
            <User className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <span>Operational Identity</span>
          </h4>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Full User Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Direct Communication Email</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Permanent Access Role</label>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg tabular-nums text-[10px] text-slate-600 uppercase flex items-center space-x-2">
                <Shield className="h-4 w-4 text-[#6C4CE1]" />
                <span>{roleLabels[userRole]} permissions active</span>
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Update Profile</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
