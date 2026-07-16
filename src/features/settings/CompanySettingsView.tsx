import React, { useState } from 'react';
import { Building2, Save, CheckCircle2 } from 'lucide-react';
import { UserRole, Organization } from '@/types';

interface CompanySettingsViewProps {
  userRole: UserRole;
  org: Organization;
  onUpdateOrg: (updates: { companyName: string; address: string; licenseId: string }) => void;
}

export default function CompanySettingsView({ userRole, org, onUpdateOrg }: CompanySettingsViewProps) {
  const [companyName, setCompanyName] = useState(org.companyName);
  const [address, setAddress] = useState(org.address || '');
  const [licenseId, setLicenseId] = useState(org.licenseId || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrg({ companyName, address, licenseId });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
          <span>Company details saved and synced across the agency workspace.</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
        <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wide border-b pb-3">
          <Building2 className="h-4.5 w-4.5 text-[#6C4CE1]" />
          <span>Corporate Account Details</span>
        </h4>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-slate-500 font-semibold">Registered Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!isAdmin}
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 bg-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-semibold">Operational Port Base / Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isAdmin}
              placeholder="e.g. Port of Southampton (Terminal 5), United Kingdom"
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 bg-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-semibold">Agency Licensing Authority ID</label>
            <input
              type="text"
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value)}
              disabled={!isAdmin}
              placeholder="e.g. UK-PORT-AGENCY-992120-X"
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 bg-white text-xs font-mono"
            />
          </div>

          {!isAdmin && (
            <span className="text-[10px] text-slate-400 font-mono block">Only Admins can modify company details.</span>
          )}

          {isAdmin && (
            <button
              type="submit"
              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Corporate Details</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
