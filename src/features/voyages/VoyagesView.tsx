import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  Ship,
  Calendar,
  CheckCircle,
  Sliders,
  Plus,
  Edit3,
  Database,
  Briefcase,
  Trash2
} from 'lucide-react';
import { Voyage, UserRole, Vessel } from '@/types';

interface VoyagesViewProps {
  voyages: Voyage[];
  vessels?: Vessel[];
  onAddVoyage: (voyage: Omit<Voyage, 'id'>) => void;
  onUpdateCargoDetails: (id: string, updates: Partial<Voyage>) => void;
  onDeleteVoyage?: (id: string) => void;
  onToggleTimelineEvent: (voyageId: string, eventIndex: number) => void;
  userRole: UserRole;
}

export default function VoyagesView({
  voyages,
  vessels = [],
  onAddVoyage,
  onUpdateCargoDetails,
  onDeleteVoyage,
  onToggleTimelineEvent,
  userRole
}: VoyagesViewProps) {
  const [selectedVoyageId, setSelectedVoyageId] = useState<string>(voyages[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCargoMode, setEditCargoMode] = useState(false);
  const [editDetailsMode, setEditDetailsMode] = useState(false);
  const [voyageToDelete, setVoyageToDelete] = useState<{ id: string; label: string } | null>(null);

  // Core voyage detail edit states (voyage number, ports, ETA/ETD)
  const [updVoyageNumber, setUpdVoyageNumber] = useState('');
  const [updOriginPort, setUpdOriginPort] = useState('');
  const [updDestinationPort, setUpdDestinationPort] = useState('');
  const [updEta, setUpdEta] = useState('');
  const [updEtd, setUpdEtd] = useState('');

  // Form State for Add Voyage
  const [vesselId, setVesselId] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [isCustomVessel, setIsCustomVessel] = useState(false);
  const [voyageNumber, setVoyageNumber] = useState('');
  const [originPort, setOriginPort] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [eta, setEta] = useState('');
  const [etd, setEtd] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [cargoQuantity, setCargoQuantity] = useState(10000);
  const [cargoStatus, setCargoStatus] = useState('Scheduled');
  const [loadingSchedule, setLoadingSchedule] = useState('');
  const [unloadingSchedule, setLoadingUnload] = useState('');

  // Cargo edit states
  const [updCargoType, setUpdCargoType] = useState('');
  const [updCargoQty, setUpdCargoQty] = useState(0);
  const [updCargoStatus, setUpdCargoStatus] = useState('');

  // Schedule / Dates edit states
  const [editScheduleMode, setEditScheduleMode] = useState(false);
  const [updActualEta, setUpdActualEta] = useState('');
  const [updActualEtb, setUpdActualEtb] = useState('');
  const [updActualEtd, setUpdActualEtd] = useState('');

  const selectedVoyage = voyages.find(v => v.id === selectedVoyageId);

  React.useEffect(() => {
    const voy = voyages.find(v => v.id === selectedVoyageId);
    if (voy) {
      setUpdCargoType(voy.cargoType);
      setUpdCargoQty(voy.cargoQuantity);
      setUpdCargoStatus(voy.cargoStatus);
      setUpdActualEta(voy.actualEta || voy.eta || '');
      setUpdActualEtb(voy.actualEtb || voy.etb || '');
      setUpdActualEtd(voy.actualEtd || voy.etd || '');
    }
  }, [selectedVoyageId, voyages]);

  const handleSelectVoyage = (id: string) => {
    setSelectedVoyageId(id);
    const voy = voyages.find(v => v.id === id);
    if (voy) {
      setUpdCargoType(voy.cargoType);
      setUpdCargoQty(voy.cargoQuantity);
      setUpdCargoStatus(voy.cargoStatus);
      setUpdActualEta(voy.actualEta || voy.eta || '');
      setUpdActualEtb(voy.actualEtb || voy.etb || '');
      setUpdActualEtd(voy.actualEtd || voy.etd || '');
    }
    setEditCargoMode(false);
    setEditScheduleMode(false);
    setEditDetailsMode(false);
  };

  const handleStartEditDetails = () => {
    if (!selectedVoyage) return;
    setUpdVoyageNumber(selectedVoyage.voyageNumber);
    setUpdOriginPort(selectedVoyage.originPort);
    setUpdDestinationPort(selectedVoyage.destinationPort);
    setUpdEta(selectedVoyage.eta);
    setUpdEtd(selectedVoyage.etd);
    setEditDetailsMode(true);
  };

  const handleSaveDetailsChanges = () => {
    if (!selectedVoyageId) return;
    onUpdateCargoDetails(selectedVoyageId, {
      voyageNumber: updVoyageNumber,
      originPort: updOriginPort,
      destinationPort: updDestinationPort,
      eta: updEta,
      etd: updEtd
    });
    setEditDetailsMode(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselName || !voyageNumber || !originPort || !destinationPort) return;
    
    const newVoy: Omit<Voyage, 'id'> = {
      vesselId: vesselId || `ves-${Date.now()}`,
      vesselName,
      voyageNumber,
      originPort,
      destinationPort,
      eta: eta || new Date().toISOString().substring(0, 16),
      etd: etd || new Date().toISOString().substring(0, 16),
      cargoType: cargoType || 'General Merchandise',
      cargoQuantity: Number(cargoQuantity) || 5000,
      cargoStatus: cargoStatus || 'Scheduled',
      loadingSchedule: loadingSchedule || 'TBA',
      unloadingSchedule: unloadingSchedule || 'TBA',
      portAgentId: '11111111-1111-1111-1111-111111111111',
      shipAgentId: '22222222-2222-2222-2222-222222222222',
      protectiveAgentId: '33333333-3333-3333-3333-333333333333',
      status: 'Scheduled',
      timeline: [
        { event: 'Departure from Origin', timestamp: eta, completed: false },
        { event: 'Mid-voyage Status Check', timestamp: eta, completed: false },
        { event: 'Pre-Arrival Documents Submitted', timestamp: eta, completed: false },
        { event: 'Arrival at Pilot Station', timestamp: eta, completed: false },
        { event: 'Vessel Berthing', timestamp: etd, completed: false },
        { event: 'Cargo Operations Commencement', timestamp: etd, completed: false }
      ]
    };

    onAddVoyage(newVoy);
    
    // Reset Form Fields
    setVesselId('');
    setVesselName('');
    setIsCustomVessel(false);
    setVoyageNumber('');
    setOriginPort('');
    setDestinationPort('');
    setEta('');
    setEtd('');
    setCargoType('');
    setCargoQuantity(10000);
    setCargoStatus('Scheduled');
    
    setShowAddModal(false);
  };

  const handleSaveCargoChanges = () => {
    if (!selectedVoyageId) return;
    onUpdateCargoDetails(selectedVoyageId, {
      cargoType: updCargoType,
      cargoQuantity: Number(updCargoQty),
      cargoStatus: updCargoStatus
    });
    setEditCargoMode(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Col 1: Voyages List Selector */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Compass className="h-4.5 w-4.5 text-[#6C4CE1]" />
            <span>Active Voyages ({voyages.length})</span>
          </h3>
          {(userRole === 'PORT_AGENT' || userRole === 'SHIP_AGENT' || userRole === 'PROTECTIVE_AGENT' || userRole === 'ADMIN') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Add New Voyage log"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Voyage</span>
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto">
          {voyages.map((voy) => {
            const isSelected = voy.id === selectedVoyageId;
            return (
              <button
                key={voy.id}
                onClick={() => handleSelectVoyage(voy.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col space-y-2.5 cursor-pointer ${
                  isSelected 
                    ? 'bg-[#6C4CE1]/10/50 border-[#6C4CE1] shadow-sm ring-1 ring-[#6C4CE1]' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-slate-800 text-sm">{voy.vesselName}</span>
                  <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-[#6C4CE1]/20 text-[#2D1B69] uppercase">
                    {voy.voyageNumber}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{voy.originPort} → {voy.destinationPort}</span>
                </div>

                <div className="flex items-center justify-between w-full text-[10px] pt-1 border-t border-slate-100/60 font-mono">
                  <span className="text-slate-400">ETA: {voy.eta.split('T')[0]}</span>
                  <span className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] ${
                    voy.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                    voy.status === 'In Transit' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {voy.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Col 2 & 3: Voyage Detail Board */}
      <div className="lg:col-span-2 space-y-6">
        {selectedVoyage ? (
          <div className="space-y-6">
            
            {/* Voyage Top Header Overview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <Ship className="h-5 w-5 text-slate-400" />
                    <span>Voyage Logistics: {selectedVoyage.vesselName}</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">Assignees • Port Agent: James Vance • Ship Agent: Sara Tanaka</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-400">Status:</span>
                  <span className="bg-[#6C4CE1]/10 text-[#2D1B69] font-bold px-2.5 py-1 rounded-lg text-xs font-mono border border-[#6C4CE1]/20">
                    {selectedVoyage.status}
                  </span>
                  {(userRole === 'PORT_AGENT' || userRole === 'SHIP_AGENT' || userRole === 'PROTECTIVE_AGENT' || userRole === 'ADMIN') && (
                    <button
                      onClick={() => setVoyageToDelete({ id: selectedVoyage.id, label: `${selectedVoyage.vesselName} (${selectedVoyage.voyageNumber})` })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Delete Voyage Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2.5">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Routing Coordinates</span>
                    <button
                      onClick={() => editDetailsMode ? setEditDetailsMode(false) : handleStartEditDetails()}
                      className="text-[10px] font-bold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{editDetailsMode ? 'Cancel' : 'Edit Details'}</span>
                    </button>
                  </div>

                  {!editDetailsMode ? (
                    <div className="space-y-1.5">
                      <div><span className="text-slate-400">Voyage ID:</span> <span className="font-semibold text-slate-800 block sm:inline">{selectedVoyage.voyageNumber}</span></div>
                      <div><span className="text-slate-400">Origin Port:</span> <span className="font-semibold text-slate-800 block sm:inline">{selectedVoyage.originPort}</span></div>
                      <div><span className="text-slate-400">Destination Port:</span> <span className="font-semibold text-slate-800 block sm:inline">{selectedVoyage.destinationPort}</span></div>
                      <div><span className="text-slate-400">ETA:</span> <span className="font-semibold text-slate-800 block sm:inline">{selectedVoyage.eta.replace('T', ' ')}</span></div>
                      <div><span className="text-slate-400">ETD:</span> <span className="font-semibold text-slate-800 block sm:inline">{selectedVoyage.etd.replace('T', ' ')}</span></div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Voyage ID</label>
                          <input
                            type="text"
                            value={updVoyageNumber}
                            onChange={(e) => setUpdVoyageNumber(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Origin Port</label>
                          <input
                            type="text"
                            value={updOriginPort}
                            onChange={(e) => setUpdOriginPort(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Destination Port</label>
                          <input
                            type="text"
                            value={updDestinationPort}
                            onChange={(e) => setUpdDestinationPort(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">ETA</label>
                          <input
                            type="datetime-local"
                            value={updEta}
                            onChange={(e) => setUpdEta(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">ETD</label>
                          <input
                            type="datetime-local"
                            value={updEtd}
                            onChange={(e) => setUpdEtd(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1.5 border-t border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => setEditDetailsMode(false)}
                          className="px-2.5 py-1 border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDetailsChanges}
                          className="px-3 py-1 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded text-[10px] font-semibold shadow-sm cursor-pointer transition-all"
                        >
                          Save Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2.5">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Schedule</span>
                    <button
                      onClick={() => setEditScheduleMode(!editScheduleMode)}
                      className="text-[10px] font-bold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{editScheduleMode ? 'Cancel' : 'Edit Dates'}</span>
                    </button>
                  </div>

                  {!editScheduleMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Actual ETA:</span>
                        <span className={`font-semibold ${selectedVoyage.actualEta ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                          {selectedVoyage.actualEta ? selectedVoyage.actualEta.replace('T', ' ') : `${selectedVoyage.eta.replace('T', ' ')} (Est)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Actual ETB:</span>
                        <span className={`font-semibold ${selectedVoyage.actualEtb ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                          {selectedVoyage.actualEtb ? selectedVoyage.actualEtb.replace('T', ' ') : (selectedVoyage.etb ? `${selectedVoyage.etb.replace('T', ' ')} (Est)` : 'Awaiting Berthing')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Actual ETD:</span>
                        <span className={`font-semibold ${selectedVoyage.actualEtd ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                          {selectedVoyage.actualEtd ? selectedVoyage.actualEtd.replace('T', ' ') : `${selectedVoyage.etd.replace('T', ' ')} (Est)`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Actual ETA (Arrival)</label>
                          <input
                            type="datetime-local"
                            value={updActualEta}
                            onChange={(e) => setUpdActualEta(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Actual ETB (Berthing)</label>
                          <input
                            type="datetime-local"
                            value={updActualEtb}
                            onChange={(e) => setUpdActualEtb(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Actual ETD (Departure)</label>
                          <input
                            type="datetime-local"
                            value={updActualEtd}
                            onChange={(e) => setUpdActualEtd(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1.5 border-t border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => setEditScheduleMode(false)}
                          className="px-2.5 py-1 border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedVoyageId) return;
                            onUpdateCargoDetails(selectedVoyageId, {
                              actualEta: updActualEta,
                              actualEtb: updActualEtb,
                              actualEtd: updActualEtd
                            });
                            setEditScheduleMode(false);
                          }}
                          className="px-3 py-1 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded text-[10px] font-semibold shadow-sm cursor-pointer transition-all"
                        >
                          Save Actual Dates
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cargo Operations Console (Ship Agent features) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Database className="h-4.5 w-4.5 text-[#6C4CE1]" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">Cargo & Manifest Declaration</h5>
                </div>
                {(userRole === 'SHIP_AGENT' || userRole === 'ADMIN') && (
                  <button
                    onClick={() => {
                      if (!editCargoMode) {
                        setUpdCargoType(selectedVoyage.cargoType);
                        setUpdCargoQty(selectedVoyage.cargoQuantity);
                        setUpdCargoStatus(selectedVoyage.cargoStatus);
                      }
                      setEditCargoMode(!editCargoMode);
                    }}
                    className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{editCargoMode ? 'Cancel Edit' : 'Modify Cargo details'}</span>
                  </button>
                )}
              </div>

              {!editCargoMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Cargo Classification</span>
                    <span className="font-semibold text-slate-800 text-sm block">{selectedVoyage.cargoType}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Manifest Quantity</span>
                    <span className="font-semibold text-slate-800 text-sm block">
                      {selectedVoyage.cargoQuantity.toLocaleString()} {selectedVoyage.cargoType.includes('LNG') ? 'CBM' : selectedVoyage.cargoType.includes('Machinery') ? 'TEU' : 'MT'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Discharge / Load Status</span>
                    <span className="font-semibold text-slate-800 text-sm block">{selectedVoyage.cargoStatus}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Cargo Type</label>
                      <input
                        type="text"
                        value={updCargoType}
                        onChange={(e) => setUpdCargoType(e.target.value)}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Quantity</label>
                      <input
                        type="number"
                        value={updCargoQty}
                        onChange={(e) => setUpdCargoQty(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Discharge Status</label>
                      <select
                        value={updCargoStatus}
                        onChange={(e) => setUpdCargoStatus(e.target.value)}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6C4CE1] bg-white cursor-pointer"
                      >
                        <option value="In Transit">In Transit</option>
                        <option value="Discharging">Discharging</option>
                        <option value="Cargo Discharge Completed">Discharge Completed</option>
                        <option value="Loading Operations">Loading Operations</option>
                        <option value="Fully Loaded">Fully Loaded</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditCargoMode(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCargoChanges}
                      className="px-3.5 py-1.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Operational Voyage Timeline */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                  <Clock className="h-4.5 w-4.5 text-slate-400" />
                  <span>Real-time Port Log & Milestones</span>
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">Authorized agents can check off milestones once completed in real-time.</p>
              </div>

              <div className="relative border-l-2 border-[#6C4CE1]/20 pl-6 ml-3 space-y-6">
                {selectedVoyage.timeline.map((item, idx) => (
                  <div key={idx} className="relative text-xs">
                    
                    {/* Node Dot */}
                    <div className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                      item.completed 
                        ? 'border-[#6C4CE1] bg-[#6C4CE1]/100 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {item.completed && <span className="block h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div>
                        <span className={`font-semibold block ${item.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                          {item.event}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.timestamp ? item.timestamp.replace('T', ' ') : 'Pending Schedule'}
                        </span>
                      </div>
                      
                      {/* Port Agent, Ship Agent or Admin can toggle milestones */}
                      {(userRole === 'PORT_AGENT' || userRole === 'SHIP_AGENT' || userRole === 'ADMIN') ? (
                        <button
                          onClick={() => onToggleTimelineEvent(selectedVoyage.id, idx)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                            item.completed 
                              ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100' 
                              : 'bg-[#6C4CE1]/10 border-[#6C4CE1]/20 text-[#2D1B69] hover:bg-[#6C4CE1]/20'
                          }`}
                        >
                          {item.completed ? 'Mark Incomplete' : 'Complete Event'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">
                          {item.completed ? 'Completed' : 'Awaiting Entry'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 rounded-xl">
            No active voyage records selected. Select a voyage from the list on the left.
          </div>
        )}
      </div>

      {/* Add Voyage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Compass className="h-5 w-5 text-[#6C4CE1]" />
                <span>Assign & Create New Voyage Log</span>
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-2">
                <label className="text-slate-500 font-semibold block">Select Registered Vessel *</label>
                {vessels && vessels.length > 0 ? (
                  <select
                    value={isCustomVessel ? 'custom' : vesselId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setIsCustomVessel(true);
                        setVesselId('');
                        setVesselName('');
                      } else {
                        setIsCustomVessel(false);
                        setVesselId(val);
                        const v = vessels.find(item => item.id === val);
                        if (v) {
                          setVesselName(v.vesselName);
                          if (v.voyageNumber) {
                            setVoyageNumber(v.voyageNumber);
                          }
                        } else {
                          setVesselName('');
                        }
                      }
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer font-sans text-xs text-slate-800"
                  >
                    <option value="">-- Choose Registered Vessel --</option>
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vesselName} (IMO: {v.imoNumber || 'N/A'}) - Owner: {v.captainDetails || 'Ship Owner'}
                      </option>
                    ))}
                    <option value="custom">➕ Use Custom / Unlisted Vessel...</option>
                  </select>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[11px] mb-1">
                    No registered vessels found in the database. You can write a custom vessel name below, or ask the Ship Owner to register one.
                  </div>
                )}

                {(isCustomVessel || !vessels || vessels.length === 0) && (
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] uppercase font-bold block">Custom Vessel Name *</label>
                    <input
                      type="text"
                      required
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                      placeholder="e.g. Pacific Empress"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none font-sans bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Voyage ID Assigned *</label>
                  <input
                    type="text"
                    required
                    value={voyageNumber}
                    onChange={(e) => setVoyageNumber(e.target.value)}
                    placeholder="e.g. PE-LNG-13"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Cargo Quantities</label>
                  <input
                    type="number"
                    value={cargoQuantity}
                    onChange={(e) => setCargoQuantity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Cargo Classification Type</label>
                  <input
                    type="text"
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    placeholder="e.g. LNG / Crude Oil / Grain"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Cargo Status</label>
                  <select
                    value={cargoStatus}
                    onChange={(e) => setCargoStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Discharging">Discharging</option>
                    <option value="Loaded">Fully Loaded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Port of Origin *</label>
                  <input
                    type="text"
                    required
                    value={originPort}
                    onChange={(e) => setOriginPort(e.target.value)}
                    placeholder="e.g. Ras Laffan"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Port of Destination *</label>
                  <input
                    type="text"
                    required
                    value={destinationPort}
                    onChange={(e) => setDestinationPort(e.target.value)}
                    placeholder="e.g. Port of Southampton"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Estimated Arrival (ETA)</label>
                  <input
                    type="datetime-local"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Estimated Departure (ETD)</label>
                  <input
                    type="datetime-local"
                    value={etd}
                    onChange={(e) => setEtd(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {voyageToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Voyage Record</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the voyage record for <span className="font-bold text-slate-800">{voyageToDelete.label}</span>? This action cannot be undone.
            </p>
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 leading-relaxed">
              This will also permanently delete every task, document, expense, message, incident, and laytime calculation linked to this voyage.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setVoyageToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteVoyage?.(voyageToDelete.id);
                  if (selectedVoyageId === voyageToDelete.id) {
                    setSelectedVoyageId(voyages.find(v => v.id !== voyageToDelete.id)?.id || '');
                  }
                  setVoyageToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-md shadow-rose-900/10"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
