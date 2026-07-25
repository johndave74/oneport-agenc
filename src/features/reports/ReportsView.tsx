import React, { useState } from 'react';
import {
  BarChart2,
  FileText,
  Download,
  CheckSquare,
  Clock,
  Ship,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Vessel, Voyage, Incident, Expense } from '@/types';
import { printDocument, opsReportHtml, OpsReportDoc } from '@/lib/documents/generate';

interface ReportsViewProps {
  vessels: Vessel[];
  voyages: Voyage[];
  incidents: Incident[];
  expenses: Expense[];
  orgName?: string;
  orgAddress?: string;
  signedByName?: string;
}

const TEMPLATE_TITLES = {
  arrival: 'Arrival Clearance Report',
  departure: 'Departure Clearance Report',
  delay: 'Delay & Disruption Log',
  daily: 'Port Expense Summary',
} as const;

const fmt = (iso?: string) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—');

export default function ReportsView({ vessels, voyages, incidents, expenses, orgName = 'OnePort', orgAddress, signedByName = 'Authorised Agent' }: ReportsViewProps) {
  const [activeReportTemplate, setActiveReportTemplate] = useState<'arrival' | 'departure' | 'delay' | 'daily'>('arrival');
  const [selectedVesselId, setSelectedVesselId] = useState<string>(vessels[0]?.id || '');
  const [reportSigned, setReportSigned] = useState(false);

  const selectedVessel = vessels.find(v => v.id === selectedVesselId) || vessels[0];
  const voyage = voyages.find(v => v.vesselId === selectedVessel?.id);

  // Real facts pulled from the port call's milestones and SOF events.
  const sofFind = (kws: string[]) =>
    (voyage?.sofEvents || []).find(e => kws.some(k => (e.eventDescription || '').toLowerCase().includes(k)));
  const milestoneFind = (kws: string[]) =>
    (voyage?.timeline || []).find(t => t.completed && kws.some(k => (t.event || '').toLowerCase().includes(k)));
  const factTime = (kws: string[]) => sofFind(kws)?.timestamp || milestoneFind(kws)?.timestamp;

  const norAt = factTime(['nor']);
  const pilotAt = factTime(['pilot']);
  const berthAt = voyage?.actualEtb || factTime(['all fast', 'berth', 'moor', 'first line']);
  const cargoStartAt = factTime(['commenc', 'cargo start', 'loading start', 'discharg']);
  const arrivedAt = voyage?.actualEta || factTime(['arriv', 'anchor', 'end of sea passage']);
  const milestonesDone = (voyage?.timeline || []).filter(t => t.completed).length;
  const milestonesTotal = (voyage?.timeline || []).length;

  const voyageNumber = voyage?.voyageNumber || selectedVessel?.voyageNumber || '';
  const voyageExpenses = expenses.filter(e => e.voyageNumber === voyageNumber);
  const pendingApprovals = voyageExpenses.filter(e => e.status === 'Pending Approval').length;
  const voyageIncidents = incidents.filter(inc => inc.voyageNumber === voyageNumber);
  const reportRef = `RPT-${(voyageNumber || 'GEN').replace(/\s+/g, '')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  // Spend analysis: real totals per category, bars scaled to the largest.
  const spendByCategory = expenses.reduce<Record<string, number>>((m, e) => {
    m[e.category] = (m[e.category] || 0) + e.amount;
    return m;
  }, {});
  const spendRows = Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const spendMax = spendRows[0]?.[1] || 0;
  const BAR_COLORS = ['bg-[#6C4CE1]', 'bg-indigo-500', 'bg-violet-400', 'bg-purple-300', 'bg-slate-300'];

  const port = voyage?.destinationPort || selectedVessel?.currentPort || '—';

  const buildPdf = (): OpsReportDoc => {
    const vesselRows: [string, string][] = [
      ['Vessel name', selectedVessel?.vesselName || '—'],
      ['IMO', selectedVessel?.imoNumber || '—'],
      ['Call sign', selectedVessel?.callSign || '—'],
      ['Flag state', selectedVessel?.flag || '—'],
      ['Port call', voyageNumber || '—'],
      ['Port', port],
      ['Current status', voyage?.status || selectedVessel?.status || '—'],
    ];
    const sections: OpsReportDoc['sections'] = [];
    if (activeReportTemplate === 'arrival') {
      sections.push({
        heading: 'Arrival Clearance Parameters',
        paragraphs: [`Arrival record for ${selectedVessel?.vesselName} at ${port}, compiled from the port call's logged milestones and Statement of Facts.`],
        rows: [
          ['ETA (estimated)', fmt(voyage?.eta || selectedVessel?.eta)],
          ['Arrived', arrivedAt ? fmt(arrivedAt) : 'Not yet arrived'],
          ['NOR tendered', norAt ? fmt(norAt) : 'Not yet tendered'],
          ['Pilot', pilotAt ? `Boarded ${fmt(pilotAt)}` : 'Not yet boarded'],
          ['Berthed / all fast', berthAt ? fmt(berthAt) : 'Not yet berthed'],
          ['Master', selectedVessel?.captainDetails || '—'],
        ],
      });
    }
    if (activeReportTemplate === 'departure') {
      sections.push({
        heading: 'Outbound Clearance Parameters',
        paragraphs: [`Departure record for ${selectedVessel?.vesselName} sailing from ${port}.`],
        rows: [
          ['ETD (estimated)', fmt(voyage?.etd || selectedVessel?.etd)],
          ['Departed', voyage?.actualEtd ? fmt(voyage.actualEtd) : 'Not yet departed'],
          ['Cargo', voyage ? `${voyage.cargoType} — ${voyage.cargoQuantity.toLocaleString()} (${voyage.cargoStatus})` : '—'],
          ['Cargo operations commenced', cargoStartAt ? fmt(cargoStartAt) : '—'],
          ['Milestones completed', milestonesTotal ? `${milestonesDone} of ${milestonesTotal}` : 'No milestones logged'],
          ['Expenses pending approval', String(pendingApprovals)],
        ],
      });
    }
    if (activeReportTemplate === 'delay') {
      sections.push({
        heading: 'Incident & Delay Record',
        paragraphs: voyageIncidents.length === 0
          ? [`No delay or disruption incidents registered for port call ${voyageNumber || '—'}.`]
          : [`${voyageIncidents.length} incident(s) registered for port call ${voyageNumber}.`],
        table: voyageIncidents.length
          ? { head: ['Incident', 'Severity', 'Status', 'Logged'], rows: voyageIncidents.map(i => [i.description, i.severity, i.status, fmt(i.createdAt)]) }
          : undefined,
      });
    }
    if (activeReportTemplate === 'daily') {
      const totEst = voyageExpenses.reduce((s, e) => s + e.estimatedAmount, 0);
      const totAct = voyageExpenses.reduce((s, e) => s + e.amount, 0);
      sections.push({
        heading: 'Voyage Spend Statement & Variance',
        paragraphs: voyageExpenses.length === 0
          ? [`No expenses recorded yet for port call ${voyageNumber || '—'}.`]
          : [`${voyageExpenses.length} expense line(s) recorded against port call ${voyageNumber}.`],
        table: voyageExpenses.length
          ? {
              head: ['Category', 'Estimated', 'Actual', 'Variance', 'Status'],
              rows: [
                ...voyageExpenses.map(e => [e.category, `$${e.estimatedAmount.toLocaleString()}`, `$${e.amount.toLocaleString()}`, `${e.amount - e.estimatedAmount >= 0 ? '+' : '-'}$${Math.abs(e.amount - e.estimatedAmount).toLocaleString()}`, e.status]),
                ['TOTAL', `$${totEst.toLocaleString()}`, `$${totAct.toLocaleString()}`, `${totAct - totEst >= 0 ? '+' : '-'}$${Math.abs(totAct - totEst).toLocaleString()}`, ''],
              ],
            }
          : undefined,
      });
    }
    return {
      orgName,
      orgAddress,
      title: TEMPLATE_TITLES[activeReportTemplate],
      reference: reportRef,
      vesselRows,
      sections,
      signedBy: reportSigned ? signedByName : undefined,
    };
  };

  const triggerExport = () => {
    printDocument(`${TEMPLATE_TITLES[activeReportTemplate]} — ${selectedVessel?.vesselName || ''}`, opsReportHtml(buildPdf()));
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
              {([
                { key: 'arrival', label: 'Arrival Clearance Report', icon: <FileText className="h-4 w-4" /> },
                { key: 'departure', label: 'Departure Clearance Report', icon: <FileText className="h-4 w-4" /> },
                { key: 'delay', label: 'Delay & Disruption Logs', icon: <Clock className="h-4 w-4 text-rose-500" /> },
                { key: 'daily', label: 'Port Expense Summary', icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => { setActiveReportTemplate(t.key); setReportSigned(false); }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                    activeReportTemplate === t.key ? 'bg-[#6C4CE1]/10 border-[#6C4CE1]/20 text-[#6C4CE1]' : 'border-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real spend per category, scaled to the largest */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <FileSpreadsheet className="h-4 w-4 text-[#6C4CE1]" />
            <span>Port Spend Analysis</span>
          </h4>
          {spendRows.length === 0 ? (
            <p className="text-[11px] text-slate-400">No expenses recorded yet — spend by category will appear here.</p>
          ) : (
            <div className="space-y-3.5 text-xs">
              {spendRows.map(([cat, amount], i) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-[11px] tabular-nums text-slate-500">
                    <span>{cat}</span>
                    <span className="font-bold text-slate-700">${amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${BAR_COLORS[i]} h-full`} style={{ width: `${spendMax ? (amount / spendMax) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  className="bg-[#6C4CE1] hover:bg-[#5839C6] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Document sheet template body */}
            <div className="p-8 space-y-8 bg-slate-50/30 font-sans max-h-[580px] overflow-y-auto">

              {/* Report Header — the actual organization's letterhead */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Ship className="h-5 w-5 text-[#6C4CE1]" />
                    <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">{orgName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 tabular-nums">{orgAddress || 'Maritime Agency'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block uppercase">{TEMPLATE_TITLES[activeReportTemplate]}</span>
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
                      Arrival record for <span className="font-bold text-slate-800">{selectedVessel.vesselName}</span> at <span className="font-semibold text-slate-800">{port}</span>, compiled from the port call's logged milestones and Statement of Facts.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 tabular-nums">
                      <div>• ETA (estimated): <span className="font-semibold text-slate-800">{fmt(voyage?.eta || selectedVessel.eta)}</span></div>
                      <div>• Arrived: {arrivedAt ? <span className="text-emerald-600 font-bold">{fmt(arrivedAt)}</span> : <span className="font-semibold text-slate-400">Not yet arrived</span>}</div>
                      <div>• NOR tendered: {norAt ? <span className="text-emerald-600 font-bold">{fmt(norAt)}</span> : <span className="font-semibold text-slate-400">Not yet tendered</span>}</div>
                      <div>• Pilot: {pilotAt ? <span className="text-emerald-600 font-bold">Boarded {fmt(pilotAt)}</span> : <span className="font-semibold text-slate-400">Not yet boarded</span>}</div>
                      <div>• Berthed / all fast: {berthAt ? <span className="text-emerald-600 font-bold">{fmt(berthAt)}</span> : <span className="font-semibold text-slate-400">Not yet berthed</span>}</div>
                      <div>• Master: <span className="font-semibold text-slate-800">{selectedVessel.captainDetails || '—'}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeReportTemplate === 'departure' && (
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 tabular-nums">II. Outbound Port Clearance Parameters</h5>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 text-xs leading-relaxed text-slate-600">
                    <p>
                      Departure record for <span className="font-bold text-slate-800">{selectedVessel.vesselName}</span> sailing from <span className="font-semibold text-slate-800">{port}</span>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 tabular-nums">
                      <div>• ETD (estimated): <span className="font-semibold text-slate-800">{fmt(voyage?.etd || selectedVessel.etd)}</span></div>
                      <div>• Departed: {voyage?.actualEtd ? <span className="text-emerald-600 font-bold">{fmt(voyage.actualEtd)}</span> : <span className="font-semibold text-slate-400">Not yet departed</span>}</div>
                      <div>• Cargo: <span className="font-semibold text-slate-800">{voyage ? `${voyage.cargoType} — ${voyage.cargoQuantity.toLocaleString()} (${voyage.cargoStatus})` : '—'}</span></div>
                      <div>• Cargo ops commenced: <span className="font-semibold text-slate-800">{cargoStartAt ? fmt(cargoStartAt) : '—'}</span></div>
                      <div>• Milestones completed: <span className="font-semibold text-slate-800">{milestonesTotal ? `${milestonesDone} of ${milestonesTotal}` : 'None logged'}</span></div>
                      <div>• Expenses pending approval: <span className={`font-bold ${pendingApprovals ? 'text-amber-600' : 'text-emerald-600'}`}>{pendingApprovals}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeReportTemplate === 'delay' && (
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-800 tabular-nums">II. Incident and Delay Record statement</h5>
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 text-xs leading-relaxed text-slate-600">
                    <p>
                      Log statement analyzing operational disruptions, pilot delays, customs flags, or bunkering holdups for voyage <span className="font-bold text-slate-800">{voyageNumber || '—'}</span>.
                    </p>
                    <div className="space-y-3 tabular-nums">
                      {voyageIncidents.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded text-center text-slate-400">
                          Perfect Record: No delay incidents registered on this voyage.
                        </div>
                      ) : (
                        voyageIncidents.map(inc => (
                          <div key={inc.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg">
                            <div className="flex justify-between items-center mb-1 font-bold">
                              <span className="text-rose-700">ALERT: {inc.severity} Severity Event</span>
                              <span className="text-[10px] text-slate-400">{fmt(inc.createdAt)}</span>
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
                    {voyageExpenses.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded text-center text-slate-400">
                        No expenses recorded yet for this port call.
                      </div>
                    ) : (
                      <>
                        <p>
                          Detailed disbursement costs compared to proforma values. Summed from expenses recorded for <span className="font-bold text-slate-800">{voyageNumber}</span>:
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
                            {voyageExpenses.map(e => {
                              const diff = e.amount - e.estimatedAmount;
                              return (
                                <tr key={e.id}>
                                  <td className="py-2 font-semibold text-slate-700">{e.category}</td>
                                  <td className="py-2 text-right">${e.estimatedAmount.toLocaleString()}</td>
                                  <td className="py-2 text-right font-bold text-slate-800">${e.amount.toLocaleString()}</td>
                                  <td className={`py-2 text-right ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {diff === 0 ? '$0' : `${diff > 0 ? '+' : '-'}$${Math.abs(diff).toLocaleString()}`}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="border-t-2 border-slate-200 font-bold text-slate-800">
                              <td className="py-2">TOTAL</td>
                              <td className="py-2 text-right">${voyageExpenses.reduce((s, e) => s + e.estimatedAmount, 0).toLocaleString()}</td>
                              <td className="py-2 text-right">${voyageExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</td>
                              <td className="py-2 text-right" />
                            </tr>
                          </tbody>
                        </table>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Signature block */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 tabular-nums block">REPORT REFERENCE</span>
                  <span className="tabular-nums text-slate-600 font-bold">{reportRef}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 tabular-nums block">AGENT SIGN-OFF AUTHORIZED</span>
                  <div className="h-10 flex items-center justify-end">
                    {reportSigned ? (
                      <span className="font-sans italic font-bold text-[#6C4CE1] text-base border-b border-[#6C4CE1] border-dashed">
                        {signedByName}
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
