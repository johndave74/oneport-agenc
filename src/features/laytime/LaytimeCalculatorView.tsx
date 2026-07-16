import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  FileText, 
  Check, 
  AlertTriangle, 
  Calendar, 
  FileDown, 
  CheckSquare, 
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Db } from '@/lib/db/db';
import { getLaytimeMath } from '@/lib/laytime';
import { Voyage, LaytimeCalculation, SOFEvent } from '@/types';

interface LaytimeCalculatorViewProps {
  currentUser: any;
}

export default function LaytimeCalculatorView({ currentUser }: LaytimeCalculatorViewProps) {
  const [calculations, setCalculations] = useState<LaytimeCalculation[]>([]);
  const [selectedCalc, setSelectedCalc] = useState<LaytimeCalculation | null>(null);
  const [voyages, setVoyages] = useState<Voyage[]>([]);

  // Editing parameters form state
  const [cargoQuantity, setCargoQuantity] = useState<number>(50000);
  const [loadingRate, setLoadingRate] = useState<number>(12000);
  const [demurrageRate, setDemurrageRate] = useState<number>(20000);
  const [despatchRate, setDespatchRate] = useState<number>(10000);
  const [laytimeTerms, setLaytimeTerms] = useState<LaytimeCalculation['laytimeTerms']>('WWD_SHEX');
  const [status, setStatus] = useState<LaytimeCalculation['status']>('Draft');

  // New SOF event form state
  const [eventTime, setEventTime] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [isCountablePercent, setIsCountablePercent] = useState<number>(100);
  const [eventComment, setEventComment] = useState<string>('');

  // New calculation form
  const [showNewCalcModal, setShowNewCalcModal] = useState(false);
  const [newCalcVoyageId, setNewCalcVoyageId] = useState('');

  // Selected sub-tab for ERP report or detail editor
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'sof' | 'statement'>('editor');

  // Load calculations and voyages from database
  useEffect(() => {
    (async () => {
      const [list, voyageList] = await Promise.all([Db.getLaytimeCalculations(), Db.getVoyages()]);
      setCalculations(list);
      if (list.length > 0) {
        setSelectedCalc(list[0]);
      }
      setVoyages(voyageList);
    })();
  }, []);

  // Update form fields when selected calculation changes
  useEffect(() => {
    if (selectedCalc) {
      setCargoQuantity(selectedCalc.cargoQuantity);
      setLoadingRate(selectedCalc.loadingRate);
      setDemurrageRate(selectedCalc.demurrageRate);
      setDespatchRate(selectedCalc.despatchRate);
      setLaytimeTerms(selectedCalc.laytimeTerms);
      setStatus(selectedCalc.status);
    }
  }, [selectedCalc]);

  const handleCreateCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    const voyage = voyages.find(v => v.id === newCalcVoyageId);
    if (!voyage) return;

    // Check cargo qty
    const cargoQty = voyage.cargoQuantity || 55000;

    const newCalc: LaytimeCalculation = {
      id: `lt-${Date.now()}`,
      voyageId: voyage.id,
      voyageNumber: voyage.voyageNumber,
      vesselName: voyage.vesselName,
      cargoQuantity: cargoQty,
      loadingRate: 12000,
      demurrageRate: 22000,
      despatchRate: 11000,
      laytimeTerms: 'WWD_SHEX',
      status: 'Draft',
      createdAt: new Date().toISOString().substring(0, 16),
      updatedAt: new Date().toISOString().substring(0, 16),
      sofEvents: [
        {
          id: `sof-init-1`,
          timestamp: new Date(voyage.eta).toISOString().substring(0, 16),
          eventDescription: 'Vessel Arrival / Notice of Readiness Tendered',
          isCountable: 0,
          comments: 'NOR Tendered'
        },
        {
          id: `sof-init-2`,
          timestamp: new Date(new Date(voyage.eta).getTime() + 12 * 60 * 60 * 1000).toISOString().substring(0, 16),
          eventDescription: 'NOR Accepted & Laytime Commences',
          isCountable: 100,
          comments: 'Laytime counting'
        },
        {
          id: `sof-init-3`,
          timestamp: new Date(voyage.etd).toISOString().substring(0, 16),
          eventDescription: 'Cargo Operations Completed',
          isCountable: 100,
          comments: 'Completed discharging'
        }
      ]
    };

    const created = await Db.addLaytimeCalculation(newCalc);
    setCalculations(prev => [...prev, created]);
    setSelectedCalc(created);
    setShowNewCalcModal(false);

    await Db.addAuditLog(
      currentUser?.id || 'sys',
      currentUser?.name || 'Operator',
      'Created Laytime Statement',
      `Created draft laytime worksheet for Voyage ${voyage.voyageNumber}`
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedCalc) return;

    const updated: LaytimeCalculation = {
      ...selectedCalc,
      cargoQuantity,
      loadingRate,
      demurrageRate,
      despatchRate,
      laytimeTerms,
      status,
      updatedAt: new Date().toISOString().substring(0, 16)
    };

    const saved = await Db.updateLaytimeCalculation(updated);
    setCalculations(prev => prev.map(c => c.id === saved.id ? saved : c));
    setSelectedCalc(saved);

    await Db.addAuditLog(
      currentUser?.id || 'sys',
      currentUser?.name || 'Operator',
      'Updated Laytime Parameters',
      `Saved cargo, rate & contract terms for Laytime Calculator sheet: ${selectedCalc.voyageNumber}`
    );
  };

  const handleAddSOFEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalc || !eventTime || !eventDescription) return;

    const newEvent: SOFEvent = {
      id: `sof-${Date.now()}`,
      timestamp: eventTime,
      eventDescription,
      isCountable: isCountablePercent,
      comments: eventComment
    };

    const updatedEvents = [...selectedCalc.sofEvents, newEvent];
    const updated: LaytimeCalculation = {
      ...selectedCalc,
      sofEvents: updatedEvents,
      updatedAt: new Date().toISOString().substring(0, 16)
    };

    const saved = await Db.updateLaytimeCalculation(updated);
    setCalculations(prev => prev.map(c => c.id === saved.id ? saved : c));
    setSelectedCalc(saved);

    // Reset Form
    setEventTime('');
    setEventDescription('');
    setIsCountablePercent(100);
    setEventComment('');

    await Db.addAuditLog(
      currentUser?.id || 'sys',
      currentUser?.name || 'Operator',
      'Added Statement of Fact',
      `Logged event "${eventDescription}" at ${eventTime} with ${isCountablePercent}% laytime count.`
    );
  };

  const handleDeleteSOFEvent = async (eventId: string) => {
    if (!selectedCalc) return;

    const updatedEvents = selectedCalc.sofEvents.filter(e => e.id !== eventId);
    const updated: LaytimeCalculation = {
      ...selectedCalc,
      sofEvents: updatedEvents,
      updatedAt: new Date().toISOString().substring(0, 16)
    };

    const saved = await Db.updateLaytimeCalculation(updated);
    setCalculations(prev => prev.map(c => c.id === saved.id ? saved : c));
    setSelectedCalc(saved);
  };

  const handleRequestApproval = async () => {
    if (!selectedCalc) return;

    const updated: LaytimeCalculation = {
      ...selectedCalc,
      status: 'Sent for Approval',
      updatedAt: new Date().toISOString().substring(0, 16)
    };

    const saved = await Db.updateLaytimeCalculation(updated);
    setCalculations(prev => prev.map(c => c.id === saved.id ? saved : c));
    setSelectedCalc(saved);

    await Db.addAuditLog(
      currentUser?.id || 'sys',
      currentUser?.name || 'Operator',
      'Laytime Shared',
      `Shared laytime statement for ${selectedCalc.voyageNumber} to Charterers and Ship Owners for final approval.`
    );
  };

  const handleApproveLaytime = async () => {
    if (!selectedCalc) return;

    const updated: LaytimeCalculation = {
      ...selectedCalc,
      status: 'Approved',
      updatedAt: new Date().toISOString().substring(0, 16)
    };

    const saved = await Db.updateLaytimeCalculation(updated);
    setCalculations(prev => prev.map(c => c.id === saved.id ? saved : c));
    setSelectedCalc(saved);

    await Db.addAuditLog(
      currentUser?.id || 'sys',
      currentUser?.name || 'Operator',
      'Laytime Approved',
      `Laytime and demurrage audit has been signed off and approved by OPA/Protective Agent.`
    );
  };

  const handleDeleteCalculation = async (id: string) => {
    await Db.deleteLaytimeCalculation(id);
    const updatedList = calculations.filter(c => c.id !== id);
    setCalculations(updatedList);
    if (updatedList.length > 0) {
      setSelectedCalc(updatedList[0]);
    } else {
      setSelectedCalc(null);
    }
  };

  const currentMath = selectedCalc ? getLaytimeMath(selectedCalc) : null;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-[#201f1e] font-sans">
      
      {/* Dynamics 365 / SAP Enterprise Command bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#6C4CE1]/10 text-[#6C4CE1] rounded-md">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 tabular-nums">
              <span>Maritime ERP</span>
              <span>/</span>
              <span>Laytime & Demurrage Ledger</span>
            </div>
            <h2 className="text-lg font-bold text-[#201f1e] tracking-tight">
              Oneport Agenc Laytime Settlement Engine
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowNewCalcModal(true)}
            className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Calculation Statement</span>
          </button>
          
          {selectedCalc && (
            <>
              {selectedCalc.status === 'Draft' && (
                <button 
                  onClick={handleRequestApproval}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[#6C4CE1]" />
                  <span>Submit for Audit</span>
                </button>
              )}

              {currentUser?.role === 'PROTECTIVE_AGENT' && selectedCalc.status === 'Sent for Approval' && (
                <button 
                  onClick={handleApproveLaytime}
                  className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Signoff & Approve Settlement</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main ERP Layout: Split Sidebar & Content */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 overflow-hidden h-full">
        
        {/* Left Side: Calculations Ledger list (SAP List Pane style) */}
        <div className="xl:col-span-1 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 tabular-nums uppercase tracking-wider">Calculations Registry</span>
            <span className="bg-[#6C4CE1]/10 text-[#6C4CE1] px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums">
              {calculations.length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {calculations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No laytime statements configured. Select 'New Calculation' to begin.
              </div>
            ) : (
              calculations.map((calc) => {
                const math = getLaytimeMath(calc);
                const isSelected = selectedCalc?.id === calc.id;
                return (
                  <div
                    key={calc.id}
                    onClick={() => setSelectedCalc(calc)}
                    className={`p-4 text-left cursor-pointer transition-colors relative ${
                      isSelected ? 'bg-[#6C4CE1]/10/70 border-l-4 border-[#6C4CE1]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-xs text-[#201f1e]">{calc.vesselName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                        calc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        calc.status === 'Sent for Approval' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {calc.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500 mt-1 tabular-nums">
                      Voyage: {calc.voyageNumber}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2 tabular-nums">
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Allowed: {(math.allowedDays).toFixed(2)}d
                      </span>
                      <span className="flex items-center">
                        <Check className="h-3.5 w-3.5 mr-1 text-[#107c41]" />
                        Used: {(math.usedDays).toFixed(2)}d
                      </span>
                    </div>

                    {/* Financial projection alert */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tabular-nums">Projected Result</span>
                      <span className={`text-xs font-bold tabular-nums flex items-center ${
                        math.isDemurrage ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {math.isDemurrage ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                        {math.isDemurrage ? 'Demurrage' : 'Despatch'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] tabular-nums text-slate-400">Net Amount</span>
                      <span className={`font-bold text-xs tabular-nums ${math.isDemurrage ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${math.financialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCalculation(calc.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Calculation Sheet Workspace */}
        <div className="xl:col-span-3 flex flex-col overflow-y-auto">
          {selectedCalc && currentMath ? (
            <div className="p-6 space-y-6">
              
              {/* Header card for the current calculation (Salesforce Lightning look) */}
              <div className="bg-white border border-slate-200 rounded shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#6C4CE1]/10 text-[#6C4CE1] text-[10px] font-bold px-2 py-0.5 rounded tabular-nums uppercase">
                        Active Charter Party Sheet
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">ID: {selectedCalc.id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#201f1e] tracking-tight mt-1 flex items-center">
                      {selectedCalc.vesselName} — Laytime Calculation Record
                    </h3>
                  </div>

                  <div className="flex items-center bg-slate-100 rounded p-1 text-xs tabular-nums border border-slate-200">
                    <button
                      onClick={() => setActiveSubTab('editor')}
                      className={`px-3 py-1.5 rounded font-semibold transition-all ${activeSubTab === 'editor' ? 'bg-white text-[#6C4CE1] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      CP Terms
                    </button>
                    <button
                      onClick={() => setActiveSubTab('sof')}
                      className={`px-3 py-1.5 rounded font-semibold transition-all ${activeSubTab === 'sof' ? 'bg-white text-[#6C4CE1] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Statement of Facts
                    </button>
                    <button
                      onClick={() => setActiveSubTab('statement')}
                      className={`px-3 py-1.5 rounded font-semibold transition-all ${activeSubTab === 'statement' ? 'bg-white text-[#6C4CE1] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Audit Report Sheet
                    </button>
                  </div>
                </div>

                {/* Key Metrics Panel (SAP KPI style) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-left">
                    <div className="text-[10px] tabular-nums font-bold text-slate-500 uppercase">Allowed Laytime</div>
                    <div className="text-lg font-bold text-slate-800 tabular-nums mt-0.5">
                      {(currentMath.allowedDays).toFixed(4)} <span className="text-xs text-slate-500">Days</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                      {(currentMath.allowedHours).toFixed(2)} Contracted Hours
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-left">
                    <div className="text-[10px] tabular-nums font-bold text-slate-500 uppercase font-sans">Laytime Used</div>
                    <div className="text-lg font-bold text-slate-800 tabular-nums mt-0.5">
                      {(currentMath.usedDays).toFixed(4)} <span className="text-xs text-slate-500">Days</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                      {(currentMath.usedHours).toFixed(2)} Total Hours Used
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-left">
                    <div className="text-[10px] tabular-nums font-bold text-slate-500 uppercase">Time Difference</div>
                    <div className="text-lg font-bold tabular-nums mt-0.5 flex items-center">
                      <span className={currentMath.isDemurrage ? 'text-rose-600' : 'text-emerald-600'}>
                        {(currentMath.varianceDays).toFixed(4)} <span className="text-xs">Days</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                      {currentMath.isDemurrage ? 'Exceeded (Demurrage)' : 'Saved (Despatch)'}
                    </div>
                  </div>

                  <div className={`rounded p-3 text-left border ${
                    currentMath.isDemurrage 
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900' 
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="text-[10px] tabular-nums font-bold uppercase">Net Financial Settlement</div>
                    <div className="text-xl font-black tabular-nums mt-0.5">
                      ${currentMath.financialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] font-semibold mt-1 tabular-nums">
                      {currentMath.isDemurrage ? 'Demurrage Payable' : 'Despatch Earned'}
                    </div>
                  </div>
                </div>

                {/* Progress bar comparison allowed vs used */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs tabular-nums text-slate-500">
                    <span>Laytime Usage Progress</span>
                    <span>
                      {((currentMath.usedHours / currentMath.allowedHours) * 100).toFixed(1)}% Counted
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        currentMath.isDemurrage ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, (currentMath.usedHours / currentMath.allowedHours) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tab 1: Charter Party Terms Editor */}
              {activeSubTab === 'editor' && (
                <div className="bg-white border border-slate-200 rounded shadow-sm p-5 space-y-4">
                  <h4 className="text-sm font-bold text-[#201f1e] border-b border-slate-100 pb-2">
                    Contractual Charter Party Parameters
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-xs text-slate-700">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Voyage Reference</label>
                        <input
                          type="text"
                          disabled
                          value={`${selectedCalc.vesselName} (Voyage: ${selectedCalc.voyageNumber})`}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Cargo Quantity (Metric Tons)</label>
                        <input
                          type="number"
                          value={cargoQuantity}
                          onChange={(e) => setCargoQuantity(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Contractual Loading Rate (MT / Day)</label>
                        <input
                          type="number"
                          value={loadingRate}
                          onChange={(e) => setLoadingRate(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Laytime Contract Terms (CP Clauses)</label>
                        <select
                          value={laytimeTerms}
                          onChange={(e) => setLaytimeTerms(e.target.value as LaytimeCalculation['laytimeTerms'])}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none cursor-pointer"
                        >
                          <option value="WWD">WWD (Weather Working Days - 24 Hours Continuous)</option>
                          <option value="WWD_SHEX">WWD SHEX (Weather Working Days, Sundays/Hols Excluded)</option>
                          <option value="WWD_FHEX">WWD FHEX (Weather Working Days, Fridays/Sats Excluded)</option>
                          <option value="WWD_WIPON_WIBON">WIPON/WIBON (Whether in Port or in Berth)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-600">Demurrage Rate (USD / Day)</label>
                          <input
                            type="number"
                            value={demurrageRate}
                            onChange={(e) => setDemurrageRate(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none tabular-nums text-rose-600 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-slate-600">Despatch Rate (USD / Day)</label>
                          <input
                            type="number"
                            value={despatchRate}
                            onChange={(e) => setDespatchRate(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none tabular-nums text-emerald-600 font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Audit Worksheet Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as LaytimeCalculation['status'])}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none cursor-pointer"
                        >
                          <option value="Draft">Draft Workspace (Local Edits)</option>
                          <option value="Sent for Approval">Pending Representative Signoff</option>
                          <option value="Approved">Approved & Ledger Cleared</option>
                          <option value="Disputed">In Dispute (Contract Arbitrage)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-end">
                    <button
                      onClick={handleSaveChanges}
                      className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white px-4 py-2 rounded text-xs font-semibold shadow-sm flex items-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>Apply Parameters & Save</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Statement of Facts Timeline Editor */}
              {activeSubTab === 'sof' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Log a new event (SOF Event Logger) */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded shadow-sm p-5 space-y-4 self-start">
                    <h4 className="text-sm font-bold text-[#201f1e] border-b border-slate-100 pb-2 flex items-center">
                      <Plus className="h-4.5 w-4.5 text-[#6C4CE1] mr-1.5" />
                      <span>Add Statement of Fact</span>
                    </h4>

                    <form onSubmit={handleAddSOFEvent} className="space-y-4 text-xs text-slate-700">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Date & Time Coordinates</label>
                        <input
                          type="datetime-local"
                          required
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none tabular-nums"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">SOF Event Description</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rain Delay - Hatches closed"
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Laytime Countable Percentage</label>
                        <select
                          value={isCountablePercent}
                          onChange={(e) => setIsCountablePercent(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none cursor-pointer tabular-nums"
                        >
                          <option value="100">100% (Standard count / Cargo Ops)</option>
                          <option value="75">75% (Restricted work)</option>
                          <option value="50">50% (Shared delay contract terms)</option>
                          <option value="25">25% (Minimal efficiency)</option>
                          <option value="0">0% (Excluded: rain, shifting, breakdown)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Select 0% for Weather delays or mechanical failures excluded by the charter party.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Comments / Remarks</label>
                        <textarea
                          placeholder="Provide specific justification or reference to logbook..."
                          value={eventComment}
                          onChange={(e) => setEventComment(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold py-2 rounded text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        Append Event Fact
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Dynamic Timeline of events */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded shadow-sm p-5 space-y-4">
                    <h4 className="text-sm font-bold text-[#201f1e] border-b border-slate-100 pb-2">
                      Chronological Statement of Facts Events
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 tabular-nums">
                            <th className="py-2.5 px-3 font-semibold">Log Timestamp</th>
                            <th className="py-2.5 px-3 font-semibold">Event Fact Details</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Laytime Count</th>
                            <th className="py-2.5 px-3 font-semibold">Comments</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentMath.sortedEvents.map((evt) => (
                            <tr key={evt.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3 tabular-nums text-slate-600 whitespace-nowrap">
                                {new Date(evt.timestamp).toLocaleString(undefined, {
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-800">
                                {evt.eventDescription}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded tabular-nums font-bold text-[10px] ${
                                  evt.isCountable === 100 ? 'bg-emerald-100 text-emerald-800' :
                                  evt.isCountable === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {evt.isCountable}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                                {evt.comments || '-'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button 
                                  onClick={() => handleDeleteSOFEvent(evt.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Detailed Laytime Sheet Statement Report */}
              {activeSubTab === 'statement' && (
                <div className="bg-white border border-slate-200 rounded shadow-sm p-8 space-y-6">
                  
                  {/* Print Document Header */}
                  <div className="border-b-2 border-slate-800 pb-5 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight uppercase">
                        Oneport Agenc Shipping & Agency Services
                      </h3>
                      <p className="text-[11px] tabular-nums text-slate-500 mt-0.5">
                        HQ Terminal Control, Dock 4, Southampton | agency@oneport.demo
                      </p>
                      <h4 className="text-sm font-bold text-[#6C4CE1] mt-4 uppercase tracking-wider tabular-nums">
                        Statement of Laytime & Demurrage Audit Report
                      </h4>
                    </div>

                    <div className="text-right text-xs">
                      <div className="bg-slate-100 border border-slate-300 rounded p-2 text-slate-700 tabular-nums text-[10px]">
                        <div>REPORT REF: <strong>LT-RECON-{selectedCalc.voyageNumber}</strong></div>
                        <div>GEN DATE: <strong>2026-07-06</strong></div>
                        <div>OPERATOR: <strong>{currentUser?.name || 'Vance, James'}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Vessel and CP Particulars Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#201f1e]">
                    <div>
                      <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 tabular-nums">
                        Vessel & Voyage Particulars
                      </h5>
                      <table className="w-full mt-2">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 font-semibold text-slate-500">Vessel Name</td>
                            <td className="py-1.5 text-right font-bold">{selectedCalc.vesselName}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 font-semibold text-slate-500">Voyage Number</td>
                            <td className="py-1.5 text-right tabular-nums">{selectedCalc.voyageNumber}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 font-semibold text-slate-500">Cargo Description</td>
                            <td className="py-1.5 text-right">Crude Oil / Dry Cargo (MT)</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-semibold text-slate-500">Total Bill of Lading Qty</td>
                            <td className="py-1.5 text-right tabular-nums font-bold">
                              {selectedCalc.cargoQuantity.toLocaleString()} MT
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 tabular-nums">
                        Charter Party Laytime Terms
                      </h5>
                      <table className="w-full mt-2">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 font-semibold text-slate-500">Loading Rate / Day</td>
                            <td className="py-1.5 text-right tabular-nums">
                              {selectedCalc.loadingRate.toLocaleString()} MT per Day
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 font-semibold text-slate-500">Contractual Clause</td>
                            <td className="py-1.5 text-right font-bold">{selectedCalc.laytimeTerms}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 font-semibold text-slate-500">Demurrage Rate</td>
                            <td className="py-1.5 text-right text-rose-600 font-bold tabular-nums">
                              ${selectedCalc.demurrageRate.toLocaleString()}/Day
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-semibold text-slate-500">Despatch Rate (Half Dem.)</td>
                            <td className="py-1.5 text-right text-emerald-600 font-bold tabular-nums">
                              ${selectedCalc.despatchRate.toLocaleString()}/Day
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Calculations Audit Trail Timesheet */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 tabular-nums">
                      Calculations Chronological Timesheet
                    </h5>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border border-slate-200">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 tabular-nums">
                            <th className="py-2 px-3 font-semibold border-r border-slate-200">From Fact</th>
                            <th className="py-2 px-3 font-semibold border-r border-slate-200">To Fact</th>
                            <th className="py-2 px-3 font-semibold text-center border-r border-slate-200">Elapsed Hours</th>
                            <th className="py-2 px-3 font-semibold text-center border-r border-slate-200">Count %</th>
                            <th className="py-2 px-3 font-semibold text-center border-r border-slate-200">Laytime Hours Used</th>
                            <th className="py-2 px-3 font-semibold text-center">Laytime Bal. (Hours)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentMath.rows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 border-r border-slate-200">
                                <span className="font-bold text-slate-700">{row.fromEvent}</span>
                                <div className="text-[9px] text-slate-400 mt-0.5 tabular-nums">
                                  {new Date(row.fromTime).toLocaleString()}
                                </div>
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <span className="font-semibold text-slate-600">{row.toEvent}</span>
                                <div className="text-[9px] text-slate-400 mt-0.5 tabular-nums">
                                  {new Date(row.toTime).toLocaleString()}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 tabular-nums font-bold text-slate-700">
                                {(row.durationHours).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums font-bold ${
                                  row.percent === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  row.percent === 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {row.percent}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 tabular-nums font-bold text-[#6C4CE1]">
                                {(row.countableHours).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center tabular-nums font-semibold text-slate-600">
                                {(row.remaining).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 font-bold border-t border-slate-300">
                            <td colSpan={2} className="py-2 px-3 text-right">Sum Total (Laytime Hours Counted):</td>
                            <td className="py-2 px-3 text-center tabular-nums">
                              {currentMath.rows.reduce((sum, r) => sum + r.durationHours, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center tabular-nums">-</td>
                            <td className="py-2 px-3 text-center tabular-nums text-[#6C4CE1]">
                              {(currentMath.usedHours).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center tabular-nums">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Financial Settlement Account Statement Box */}
                  <div className="bg-slate-50 border border-slate-300 rounded p-5 space-y-3">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] tabular-nums">
                      Laytime Settlement Ledger Reconciliation
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs tabular-nums">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                          <span className="text-slate-500">Allowed Contract Laytime:</span>
                          <span className="font-bold text-slate-800">
                            {(currentMath.allowedDays).toFixed(4)} Days ({(currentMath.allowedHours).toFixed(2)} hours)
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                          <span className="text-slate-500">Actual Counted Laytime:</span>
                          <span className="font-bold text-slate-800">
                            {(currentMath.usedDays).toFixed(4)} Days ({(currentMath.usedHours).toFixed(2)} hours)
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                          <span className="text-slate-500">Calculated Variance Days:</span>
                          <span className={`font-bold ${currentMath.isDemurrage ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {(currentMath.isDemurrage ? '+' : '-')}{(currentMath.varianceDays).toFixed(4)} Days
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded p-3 text-center flex flex-col justify-center items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reconciled Final Settlement</span>
                        <span className={`text-xl font-black ${currentMath.isDemurrage ? 'text-rose-600' : 'text-emerald-600'} mt-1`}>
                          {currentMath.isDemurrage ? 'Demurrage Payable' : 'Despatch Earned'}
                        </span>
                        <span className={`text-2xl font-black tabular-nums mt-1 ${currentMath.isDemurrage ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ${currentMath.financialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures Panel */}
                  <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs font-sans">
                    <div className="text-left space-y-6">
                      <div className="border-b border-slate-300 h-10 w-48" />
                      <div>
                        <div className="font-bold text-slate-700">Authorized Protective Ship Agent</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Oneport Agenc, UK Branch</div>
                      </div>
                    </div>

                    <div className="text-right space-y-6 flex flex-col items-end">
                      <div className="border-b border-slate-300 h-10 w-48" />
                      <div>
                        <div className="font-bold text-slate-700">Master / Representative Charterer</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Vessel Command Deck signoff</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Calculator className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <span>Select or Create a Laytime Calculation statement above to begin auditing.</span>
            </div>
          )}
        </div>

      </div>

      {/* New Calculation Sheet Modal */}
      {showNewCalcModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#6C4CE1] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-tight flex items-center">
                <Calculator className="h-4.5 w-4.5 mr-2" />
                <span>Initialize Laytime Audit Worksheet</span>
              </h3>
              <button 
                onClick={() => setShowNewCalcModal(false)}
                className="text-white hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCalculation} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Select Voyage Reference Record</label>
                <select
                  required
                  value={newCalcVoyageId}
                  onChange={(e) => setNewCalcVoyageId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 focus:border-[#6C4CE1] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Active Voyage --</option>
                  {voyages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vesselName} (Voyage: {v.voyageNumber}) - {v.cargoType}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Selecting a voyage loads the live vessel records and estimated Port timings automatically.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] leading-relaxed text-slate-600">
                <span className="font-bold text-slate-700 block">Maritime Math Notice:</span>
                Laytime will count according to Statement of Fact entries. Allowed hours are computed directly as Cargo Tons / Contract Loading rate.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCalcModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCalcVoyageId}
                  className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 disabled:bg-slate-300 text-white font-semibold px-4 py-2 rounded shadow-sm"
                >
                  Create Worksheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
