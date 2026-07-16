import React, { useState } from 'react';
import { 
  BarChart2, 
  FileText, 
  Printer, 
  Download, 
  RefreshCw, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Ship,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Vessel, Voyage, Incident, Expense } from '@/types';

interface ReportsViewProps {
  vessels: Vessel[];
  voyages: Voyage[];
  incidents: Incident[];
  expenses: Expense[];
}

export default function ReportsView({ vessels, voyages, incidents, expenses }: ReportsViewProps) {
  const [activeReportTemplate, setActiveReportTemplate] = useState<'arrival' | 'departure' | 'delay' | 'daily'>('arrival');
  const [selectedVesselId, setSelectedVesselId] = useState<string>(vessels[0]?.id || '');
  const [reportSigned, setReportSigned] = useState(false);

  const selectedVessel = vessels.find(v => v.id === selectedVesselId) || vessels[0];
  const associatedVoyage = voyages.find(v => v.vesselId === selectedVessel?.id);

  // Stats for simple charts
  const totalFuelSpend = expenses.filter(e => e.category === 'Bunkering').reduce((sum, e) => sum + e.amount, 0);
  const totalPilotageSpend = expenses.filter(e => e.category === 'Pilotage').reduce((sum, e) => sum + e.amount, 0);
  const totalTugSpend = expenses.filter(e => e.category === 'Tug Services').reduce((sum, e) => sum + e.amount, 0);
  const totalPortSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const triggerExport = () => {
    const element = window.document.createElement("a");
    const file = new Blob([
      `OFFICIAL MARITIME REPORT EXPORT\n`,
      `==============================\n`,
      `Report Class: ${activeReportTemplate.toUpperCase()} REPORT\n`,
      `Vessel Target: ${selectedVessel?.vesselName}\n`,
      `IMO: ${selectedVessel?.imoNumber}\n`,
      `Call Sign: ${selectedVessel?.callSign}\n`,
      `Flag Registry: ${selectedVessel?.flag}\n`,
      `Timestamp: ${new Date().toISOString()}\n`,
      `Sign-off Signature: ${reportSigned ? 'VERIFIED ELECTRONIC AGENT SIGNATURE' : 'PENDING'}\n\n`,
      `REPORT DETAIL FIELD LOGS:\n`,
      `------------------------------\n`,
      `Current Status: ${selectedVessel?.status}\n`,
      `Port Location: ${selectedVessel?.currentPort}\n`,
      `Assigned Voyage ID: ${selectedVessel?.voyageNumber}\n`,
      associatedVoyage ? `Origin coordinates: ${associatedVoyage.originPort}\nCargo Type: ${associatedVoyage.cargoType}\nQuantity: ${associatedVoyage.cargoQuantity}` : 'No active voyage assignments'
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeReportTemplate}_report_${selectedVessel?.vesselName.replace(/\s+/g, '_')}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Col 1: Template selector */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <BarChart2 className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <span>Operational Templates</span>
          </h4>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Target Vessel</label>
            <select
              value={selectedVesselId}
              onChange={(e) => {
                setSelectedVesselId(e.target.value);
                setReportSigned(false);
              }}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              {vessels.map(v => (
                <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Select Report Format</label>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => { setActiveReportTemplate('arrival'); setReportSigned(false); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeReportTemplate === 'arrival' ? 'bg-[#6C4CE1]/10 border-[#6C4CE1]/20 text-[#6C4CE1]' : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Arrival Clearance Report</span>
              </button>
              <button
                onClick={() => { setActiveReportTemplate('departure'); setReportSigned(false); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeReportTemplate === 'departure' ? 'bg-[#6C4CE1]/10 border-[#6C4CE1]/20 text-[#6C4CE1]' : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Departure Clearance Report</span>
              </button>
              <button
                onClick={() => { setActiveReportTemplate('delay'); setReportSigned(false); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeReportTemplate === 'delay' ? 'bg-[#6C4CE1]/10 border-[#6C4CE1]/20 text-[#6C4CE1]' : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="h-4 w-4 text-rose-500" />
                <span>Delay & Disruption Logs</span>
              </button>
              <button
                onClick={() => { setActiveReportTemplate('daily'); setReportSigned(false); }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeReportTemplate === 'daily' ? 'bg-[#6C4CE1]/10 border-[#6C4CE1]/20 text-[#6C4CE1]' : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Port Expense Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expenses simple visual chart blocks */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <FileSpreadsheet className="h-4 w-4 text-[#6C4CE1]" />
            <span>Port Spend Analysis</span>
          </h4>
          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] tabular-nums text-slate-500">
                <span>Pilotage Costs</span>
                <span className="font-bold text-slate-700">${totalPilotageSpend.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#6C4CE1] h-full" style={{ width: `${(totalPilotageSpend / totalPortSpend)*100 || 20}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] tabular-nums text-slate-500">
                <span>Tug Assistance</span>
                <span className="font-bold text-slate-700">${totalTugSpend.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${(totalTugSpend / totalPortSpend)*100 || 40}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] tabular-nums text-slate-500">
                <span>Marine Fuel Spend</span>
                <span className="font-bold text-slate-700">${totalFuelSpend.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#6C4CE1]/100 h-full" style={{ width: `${(totalFuelSpend / totalPortSpend)*100 || 30}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Col 2 & 3: Report Viewer Frame */}
      <div className="lg:col-span-2 space-y-6">
        {selectedVessel ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col h-full">
            
            {/* Viewer Controls bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs tabular-nums font-bold text-slate-500">FORMAT: PDF EXPORT PREVIEW</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReportSigned(!reportSigned)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1 transition-all cursor-pointer ${
                    reportSigned 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>{reportSigned ? 'Electronically Signed' : 'Sign Off Report'}</span>
                </button>
                <button
                  onClick={triggerExport}
                  className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report (.txt)</span>
                </button>
              </div>
            </div>

            {/* Document sheet template body */}
            <div className="p-8 space-y-8 bg-slate-50/30 font-sans max-h-[580px] overflow-y-auto">
              
              {/* Report Header Logo Section */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Ship className="h-5 w-5 text-[#6C4CE1]" />
                    <span className="text-sm font-bold text-slate-800 tracking-tight">APEX PORT AGENCY SERVICES</span>
                  </div>
                  <p className="text-[10px] text-slate-400 tabular-nums">Oceanic Command Terminal 5, Southampton, SO14</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">PORT OPERATION STATEMENT</span>
                  <span className="text-[10px] text-slate-400 tabular-nums block">DATE: {new Date().toISOString().substring(0, 10)}</span>
                </div>
              </div>

              {/* Vessel specs block */}
              <div className="space-y-3.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 tabular-nums">I. Vessel Registry Identity</h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs tabular-nums bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Vessel Name</span>
                    <span className="font-bold text-slate-800">{selectedVessel.vesselName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">IMO Register</span>
                    <span className="font-semibold text-slate-800">{selectedVessel.imoNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Call Sign</span>
                    <span className="font-semibold text-slate-800">{selectedVessel.callSign}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Flag State</span>
                    <span className="font-semibold text-slate-800">{selectedVessel.flag}</span>
                  </div>
                </div>
              </div>

              {/* Conditionally render template body */}
              {activeReportTemplate === 'arrival' && (
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 tabular-nums">II. Arrival Clearance Parameters</h5>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 text-xs leading-relaxed text-slate-600">
                    <p>
                      This serves as official confirmation that the vessel <span className="font-bold text-slate-800">{selectedVessel.vesselName}</span> is cleared for pilot boarding and berthing operations at <span className="font-semibold text-slate-800">{selectedVessel.currentPort}</span>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 tabular-nums">
                      <div>• Estimated Pilot Entry (ETA): <span className="font-semibold text-slate-800">{selectedVessel.eta.replace('T', ' ')}</span></div>
                      <div>• Captain Command: <span className="font-semibold text-slate-800">{selectedVessel.captainDetails}</span></div>
                      <div>• Outward voyage ID: <span className="font-semibold text-slate-800">{selectedVessel.voyageNumber}</span></div>
                      <div>• Customs Exemption Status: <span className="text-emerald-600 font-bold">GRANTED</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeReportTemplate === 'departure' && (
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 tabular-nums">II. Outbound Port Clearance Parameters</h5>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 text-xs leading-relaxed text-slate-600">
                    <p>
                      Official clearance statement certifying that all outbound customs declarations, port fees, and crew registers have been cleared in full for <span className="font-bold text-slate-800">{selectedVessel.vesselName}</span>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 tabular-nums">
                      <div>• Departure Time (ETD): <span className="font-semibold text-slate-800">{selectedVessel.etd.replace('T', ' ')}</span></div>
                      <div>• Cargo Manifest Cleared: <span className="text-emerald-600 font-bold">YES</span></div>
                      <div>• Marine Fuel (MGO) supplied: <span className="font-semibold text-slate-800">350 Metric Tons</span></div>
                      <div>• Mooring Crew Scheduled: <span className="font-semibold text-slate-850">Approved</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeReportTemplate === 'delay' && (
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 tabular-nums">II. Incident and Delay Record statement</h5>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 text-xs leading-relaxed text-slate-600">
                    <p>
                      Log statement analyzing operational disruptions, pilot delays, customs flags, or bunkering holdups for voyage <span className="font-bold text-slate-800">{selectedVessel.voyageNumber}</span>.
                    </p>
                    <div className="space-y-3 tabular-nums">
                      {incidents.filter(inc => inc.voyageNumber === selectedVessel.voyageNumber).length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded text-center text-slate-400">
                          Perfect Record: No delay incidents registered on this voyage.
                        </div>
                      ) : (
                        incidents.filter(inc => inc.voyageNumber === selectedVessel.voyageNumber).map(inc => (
                          <div key={inc.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg">
                            <div className="flex justify-between items-center mb-1 font-bold">
                              <span className="text-rose-700">ALERT: {inc.severity} Severity Event</span>
                              <span className="text-[10px] text-slate-400">{inc.createdAt.replace('T', ' ')}</span>
                            </div>
                            <p className="text-slate-600">{inc.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeReportTemplate === 'daily' && (
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 tabular-nums">II. Voyage Spend Statement & Variance</h5>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 text-xs leading-relaxed text-slate-600">
                    <p>
                      Detailed disbursement costs compared to proforma values. Summed from active expenses recorded for <span className="font-bold text-slate-800">{selectedVessel.voyageNumber}</span>:
                    </p>
                    <table className="w-full text-left tabular-nums text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                          <th className="py-2">Category</th>
                          <th className="py-2 text-right">Proforma PDA</th>
                          <th className="py-2 text-right">Actual FDA</th>
                          <th className="py-2 text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.filter(e => e.voyageNumber === selectedVessel.voyageNumber).map(e => (
                          <tr key={e.id}>
                            <td className="py-2 font-semibold text-slate-700">{e.category}</td>
                            <td className="py-2 text-right">${e.estimatedAmount.toLocaleString()}</td>
                            <td className="py-2 text-right font-bold text-slate-800">${e.amount.toLocaleString()}</td>
                            <td className="py-2 text-right text-rose-600">
                              {e.amount > e.estimatedAmount ? `+$${(e.amount - e.estimatedAmount).toLocaleString()}` : '$0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Signature block */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 tabular-nums block">CLEARANCE SYSTEM AUDIT ID</span>
                  <span className="tabular-nums text-slate-600 font-bold">APEX-LOG-2026-07-03</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 tabular-nums block">AGENT SIGN-OFF AUTHORIZED</span>
                  <div className="h-10 flex items-center justify-end">
                    {reportSigned ? (
                      <span className="font-sans italic font-bold text-[#6C4CE1] text-base border-b border-[#6C4CE1] border-dashed animate-pulse">
                        James Vance, Port Agent
                      </span>
                    ) : (
                      <span className="text-rose-500 font-semibold italic border border-rose-200 bg-rose-50/50 px-2 py-0.5 rounded">
                        Pending Signature
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 rounded-xl">
            Register a vessel to generate reports.
          </div>
        )}
      </div>

    </div>
  );
}
