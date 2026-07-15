import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Incident, Voyage } from '@/types';

interface IncidentCentreProps {
  incidents: Incident[];
  voyages: Voyage[];
  demurrageRiskCount: number;
  onCreateIncident: (desc: string, severity: 'Low' | 'Medium' | 'High' | 'Critical', voyageId: string) => void;
}

interface DelayEntry {
  voyage: Voyage;
  etaDelayHrs: number | null;
  etdDelayHrs: number | null;
}

function computeDelays(voyages: Voyage[]): DelayEntry[] {
  return voyages
    .map(v => ({
      voyage: v,
      etaDelayHrs: v.actualEta && v.eta ? (new Date(v.actualEta).getTime() - new Date(v.eta).getTime()) / 3.6e6 : null,
      etdDelayHrs: v.actualEtd && v.etd ? (new Date(v.actualEtd).getTime() - new Date(v.etd).getTime()) / 3.6e6 : null,
    }))
    .filter(d => (d.etaDelayHrs ?? 0) > 1 || (d.etdDelayHrs ?? 0) > 1);
}

const SEVERITY_WEIGHT: Record<Incident['severity'], number> = { Low: 1, Medium: 2, High: 3, Critical: 5 };

function computeRiskScore(openIncidents: Incident[], delayCount: number, demurrageRiskCount: number) {
  const raw = openIncidents.reduce((s, i) => s + SEVERITY_WEIGHT[i.severity], 0) + delayCount * 2 + demurrageRiskCount * 3;
  const label = raw === 0 ? 'Low' : raw <= 6 ? 'Elevated' : 'High';
  return { score: raw, label };
}

const RISK_BADGE_STYLES: Record<string, string> = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Elevated: 'bg-amber-50 text-amber-700 border-amber-100',
  High: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function IncidentCentre({ incidents, voyages, demurrageRiskCount, onCreateIncident }: IncidentCentreProps) {
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [incidentVoyageId, setIncidentVoyageId] = useState('');

  const openIncidents = incidents.filter(i => i.status !== 'Resolved');
  const delays = computeDelays(voyages);
  const risk = computeRiskScore(openIncidents, delays.length, demurrageRiskCount);
  const activeVoyages = voyages.filter(v => v.status !== 'Completed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc || !incidentVoyageId) return;
    onCreateIncident(incidentDesc, incidentSeverity, incidentVoyageId);
    setIncidentDesc('');
    setShowIncidentModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Incident Centre</h4>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${RISK_BADGE_STYLES[risk.label]}`}>
          Risk: {risk.label}
        </span>
      </div>

      {openIncidents.length === 0 && delays.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No active incidents."
          description="System operating normally — no open incidents or delay variance recorded."
          size="sm"
        />
      ) : (
        <div className="space-y-4">
          {openIncidents.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Open Incidents ({openIncidents.length})</span>
              {openIncidents.map(inc => (
                <div key={inc.id} className="border-l-2 border-rose-500 pl-3 py-1.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{inc.voyageNumber}</span>
                    <span className={`text-[9px] font-mono font-bold px-1 rounded uppercase ${
                      inc.severity === 'Critical' || inc.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{inc.description}</p>
                  <span className="text-[9px] text-slate-400 block font-mono">Reported by {inc.reportedBy}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Recent Delays</span>
            {delays.length === 0 ? (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No delay variance recorded yet. Delays appear once actual arrival/departure times are logged against scheduled ETA/ETD.
              </p>
            ) : (
              delays.map(d => (
                <div key={d.voyage.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold truncate max-w-[140px]">{d.voyage.vesselName}</span>
                  <span className="text-[10px] font-mono text-rose-600 font-bold">
                    {d.etaDelayHrs && d.etaDelayHrs > 1 ? `+${d.etaDelayHrs.toFixed(1)}h ETA` : `+${(d.etdDelayHrs ?? 0).toFixed(1)}h ETD`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowIncidentModal(true)}
        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2 rounded-lg border border-slate-200 transition-colors text-center block"
      >
        Report Incident / Delay Event
      </button>

      {showIncidentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
                <span>Log Maritime / Port Incident</span>
              </h4>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Associate with Active Voyage</label>
                <select
                  value={incidentVoyageId}
                  onChange={(e) => setIncidentVoyageId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Choose Voyage --</option>
                  {activeVoyages.map(voy => (
                    <option key={voy.id} value={voy.id}>
                      {voy.vesselName} ({voy.voyageNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Event Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setIncidentSeverity(sev)}
                      className={`py-1.5 text-xs rounded-lg border font-medium ${
                        incidentSeverity === sev
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Accurate Event Description</label>
                <textarea
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Describe the delay source, mechanical issue, customs flag, or pilotage incident in details..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs h-28 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-900/10"
                >
                  File Incident Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
