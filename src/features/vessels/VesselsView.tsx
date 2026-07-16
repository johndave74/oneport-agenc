import React, { useState } from 'react';
import { 
  Ship, 
  Search, 
  Plus, 
  Filter, 
  User, 
  Anchor, 
  Navigation, 
  Calendar, 
  Info, 
  CheckCircle,
  FileText,
  Trash2,
  Edit2
} from 'lucide-react';
import { Vessel, VesselStatus, UserRole, User as AppUser } from '@/types';

interface VesselsViewProps {
  vessels: Vessel[];
  users?: AppUser[];
  onAddVessel: (vessel: Omit<Vessel, 'id'>) => void;
  onEditVessel?: (vessel: Vessel) => void;
  onDeleteVessel?: (id: string) => void;
  onUpdateVesselStatus: (id: string, status: VesselStatus) => void;
  userRole: UserRole;
}

export default function VesselsView({ 
  vessels, 
  users = [],
  onAddVessel, 
  onEditVessel, 
  onDeleteVessel, 
  onUpdateVesselStatus, 
  userRole 
}: VesselsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Vessel Form State
  const [name, setName] = useState('');
  const [imo, setImo] = useState('');
  const [callSign, setCallSign] = useState('');
  const [flag, setFlag] = useState('');
  const [vesselType, setVesselType] = useState('Container Ship');
  const [gt, setGt] = useState(50000);
  const [dwt, setDwt] = useState(65000);
  const [captain, setCaptain] = useState('');
  const [crewCount, setCrewCount] = useState(20);
  const [eta, setEta] = useState('');
  const [etd, setEtd] = useState('');
  const [currentPort, setCurrentPort] = useState('Port of Southampton');
  const [voyageNumber, setVoyageNumber] = useState('');
  const [status, setStatus] = useState<VesselStatus>('Scheduled');
  const [assignedAgentId, setAssignedAgentId] = useState('');

  // Edit Vessel Form State
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [editName, setEditName] = useState('');
  const [editImo, setEditImo] = useState('');
  const [editCallSign, setEditCallSign] = useState('');
  const [editFlag, setEditFlag] = useState('');
  const [editVesselType, setEditVesselType] = useState('Container Ship');
  const [editGt, setEditGt] = useState(50000);
  const [editDwt, setEditDwt] = useState(65000);
  const [editCaptain, setEditCaptain] = useState('');
  const [editCrewCount, setEditCrewCount] = useState(20);
  const [editCurrentPort, setEditCurrentPort] = useState('Port of Southampton');
  const [editVoyageNumber, setEditVoyageNumber] = useState('');
  const [editStatus, setEditStatus] = useState<VesselStatus>('Scheduled');
  const [editEta, setEditEta] = useState('');
  const [editEtd, setEditEtd] = useState('');
  const [editAssignedAgentId, setEditAssignedAgentId] = useState('');

  // Delete confirmation State
  const [vesselToDelete, setVesselToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleStartEdit = (v: Vessel) => {
    setEditingVessel(v);
    setEditName(v.vesselName);
    setEditImo(v.imoNumber);
    setEditCallSign(v.callSign || '');
    setEditFlag(v.flag || '');
    setEditVesselType(v.vesselType);
    setEditGt(v.grossTonnage);
    setEditDwt(v.deadweight);
    setEditCaptain(v.captainDetails || '');
    setEditCrewCount(v.crewCount);
    setEditCurrentPort(v.currentPort);
    setEditVoyageNumber(v.voyageNumber);
    setEditStatus(v.status);
    setEditEta(v.eta);
    setEditEtd(v.etd);
    setEditAssignedAgentId(v.assignedPortAgentId || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVessel) return;
    if (!editName || !editImo || !editVoyageNumber) return;

    const selectedAgent = users.find(u => u.id === editAssignedAgentId);

    onEditVessel?.({
      ...editingVessel,
      vesselName: editName,
      imoNumber: editImo,
      callSign: editCallSign || 'N/A',
      flag: editFlag || 'Unknown',
      vesselType: editVesselType,
      grossTonnage: Number(editGt),
      deadweight: Number(editDwt),
      captainDetails: editCaptain || 'TBA',
      crewCount: Number(editCrewCount),
      eta: editEta || new Date().toISOString().substring(0, 16),
      etd: editEtd || new Date().toISOString().substring(0, 16),
      currentPort: editCurrentPort,
      voyageNumber: editVoyageNumber,
      status: editStatus,
      assignedPortAgentId: editAssignedAgentId || undefined,
      assignedPortAgentName: selectedAgent ? selectedAgent.name : undefined
    });

    setEditingVessel(null);
  };

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch = 
      v.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.imoNumber.includes(searchTerm) ||
      v.flag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imo || !voyageNumber) return;

    const selectedAgent = users.find(u => u.id === assignedAgentId);

    onAddVessel({
      vesselName: name,
      imoNumber: imo,
      callSign: callSign || 'N/A',
      flag: flag || 'Unknown',
      vesselType,
      grossTonnage: Number(gt),
      deadweight: Number(dwt),
      captainDetails: captain || 'TBA',
      crewCount: Number(crewCount),
      eta: eta || new Date().toISOString().substring(0, 16),
      etd: etd || new Date().toISOString().substring(0, 16),
      currentPort,
      voyageNumber,
      status,
      assignedPortAgentId: assignedAgentId || undefined,
      assignedPortAgentName: selectedAgent ? selectedAgent.name : undefined
    });

    // Reset Form
    setName('');
    setImo('');
    setCallSign('');
    setFlag('');
    setCaptain('');
    setVoyageNumber('');
    setAssignedAgentId('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vessel name, IMO, voyage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Arriving">Arriving</option>
              <option value="Berthed">Berthed</option>
              <option value="Cargo Operations">Cargo Operations</option>
              <option value="Departing">Departing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Action Button: Ship Agent or Admin can add Vessels */}
        {(userRole === 'SHIP_AGENT' || userRole === 'ADMIN') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-150 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Vessel Record</span>
          </button>
        )}
      </div>

      {/* Main Vessels Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-5">Vessel Profile</th>
                <th className="py-3 px-4">Registry Identifiers</th>
                <th className="py-3 px-4">Specifications</th>
                <th className="py-3 px-4">Command & Crew</th>
                <th className="py-3 px-4">Schedule / ETA / ETD</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-right">Update Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredVessels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-10 text-slate-400">
                    No active maritime vessel logs match your query.
                  </td>
                </tr>
              ) : (
                filteredVessels.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold tabular-nums shrink-0">
                          <Ship className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">{v.vesselName}</span>
                          <div className="flex flex-wrap gap-1 mt-1 items-center">
                            <span className="text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 inline-block tabular-nums font-semibold">
                              {v.vesselType}
                            </span>
                            {v.assignedPortAgentName ? (
                              <span className="text-[10px] text-[#6C4CE1] bg-[#6C4CE1]/10 border border-[#6C4CE1]/20 rounded-sm px-1.5 py-0.5 inline-flex items-center font-bold" title={`Attached Port Agent: ${v.assignedPortAgentName}`}>
                                <span className="h-1 w-1 bg-[#6C4CE1] rounded-full mr-1 shrink-0"></span>
                                <span className="tabular-nums">
                                  Agent: {v.assignedPortAgentName}
                                  {(() => {
                                    const matched = users.find(u => u.id === v.assignedPortAgentId || u.name === v.assignedPortAgentName);
                                    return matched?.rating ? ` (★${matched.rating})` : '';
                                  })()}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-sm px-1.5 py-0.5 inline-flex items-center font-semibold tabular-nums">
                                <span>⚠️ No Agent Attached</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 tabular-nums">
                      <div className="text-slate-700">IMO: <span className="font-bold">{v.imoNumber}</span></div>
                      <div className="text-slate-400 text-[10px]">Callsign: {v.callSign}</div>
                      <div className="text-slate-400 text-[10px]">Flag: {v.flag}</div>
                    </td>
                    <td className="py-4 px-4 tabular-nums text-[10px] text-slate-500 space-y-0.5">
                      <div>GT: {v.grossTonnage.toLocaleString()} tons</div>
                      <div>DWT: {v.deadweight.toLocaleString()} tons</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-700">{v.captainDetails}</div>
                      <div className="text-slate-400 text-[10px] tabular-nums">{v.crewCount} Crew Members</div>
                    </td>
                    <td className="py-4 px-4 tabular-nums text-[10px] text-slate-600 space-y-0.5">
                      <div className="text-slate-500">Port: <span className="font-semibold text-slate-800">{v.currentPort}</span></div>
                      <div>Voyage: <span className="font-bold text-[#2D1B69]">{v.voyageNumber}</span></div>
                      <div className="text-emerald-700 font-semibold">ETA: {v.eta.replace('T', ' ')}</div>
                      <div className="text-amber-700 font-semibold">ETD: {v.etd.replace('T', ' ')}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'Arriving' ? 'bg-amber-100 text-amber-800' :
                        v.status === 'Berthed' ? 'bg-indigo-100 text-indigo-800' :
                        v.status === 'Cargo Operations' ? 'bg-emerald-100 text-emerald-850' :
                        v.status === 'Departing' ? 'bg-rose-100 text-rose-800' :
                        v.status === 'Completed' ? 'bg-slate-100 text-slate-800' :
                        'bg-[#6C4CE1]/20 text-[#2D1B69]'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {/* Port Agent and Ship Agent can dynamically adjust status */}
                      {(userRole === 'PORT_AGENT' || userRole === 'SHIP_AGENT' || userRole === 'ADMIN') ? (
                        <div className="flex items-center justify-end space-x-2">
                          <select
                            value={v.status}
                            onChange={(e) => onUpdateVesselStatus(v.id, e.target.value as VesselStatus)}
                            className="border border-slate-200 rounded p-1 text-[10px] font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Arriving">Arriving</option>
                            <option value="Berthed">Berthed</option>
                            <option value="Cargo Operations">Cargo Operations</option>
                            <option value="Departing">Departing</option>
                            <option value="Completed">Completed</option>
                          </select>
                          
                          <button
                            onClick={() => handleStartEdit(v)}
                            className="p-1.5 text-slate-400 hover:text-[#2D1B69] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Vessel Record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setVesselToDelete({ id: v.id, name: v.vesselName })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete Vessel Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 tabular-nums text-[10px]">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vessel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Ship className="h-5 w-5 text-[#6C4CE1]" />
                <span>Create Vessel Registration Log</span>
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Vessel Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Queen Elizabeth Tanker"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">IMO Number *</label>
                  <input
                    type="text"
                    required
                    value={imo}
                    onChange={(e) => setImo(e.target.value)}
                    placeholder="e.g. 9482154"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Call Sign *</label>
                  <input
                    type="text"
                    required
                    value={callSign}
                    onChange={(e) => setCallSign(e.target.value)}
                    placeholder="e.g. ZQD44"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Vessel Type</label>
                  <select
                    value={vesselType}
                    onChange={(e) => setVesselType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="Container Ship">Container Ship</option>
                    <option value="LNG Carrier">LNG Carrier</option>
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="Oil Tanker">Oil Tanker</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Ro-Ro Vessel">Ro-Ro Vessel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Flag Registry</label>
                  <input
                    type="text"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="e.g. Panama"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Voyage ID Assigned *</label>
                  <input
                    type="text"
                    required
                    value={voyageNumber}
                    onChange={(e) => setVoyageNumber(e.target.value)}
                    placeholder="e.g. QE-VOY-05"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Gross Tonnage</label>
                  <input
                    type="number"
                    value={gt}
                    onChange={(e) => setGt(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Deadweight Tonnage (DWT)</label>
                  <input
                    type="number"
                    value={dwt}
                    onChange={(e) => setDwt(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Captain Details</label>
                  <input
                    type="text"
                    value={captain}
                    onChange={(e) => setCaptain(e.target.value)}
                    placeholder="e.g. Capt. James Hook"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Crew Onboard Count</label>
                  <input
                    type="number"
                    value={crewCount}
                    onChange={(e) => setCrewCount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Scheduled Entry Port</label>
                  <input
                    type="text"
                    value={currentPort}
                    onChange={(e) => setCurrentPort(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Attach Port Agent</label>
                  <select
                    value={assignedAgentId}
                    onChange={(e) => setAssignedAgentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer text-xs mb-1"
                  >
                    <option value="">-- No Agent Attached (Unassigned) --</option>
                    {users.filter(u => u.role === 'PORT_AGENT').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Rating: {u.rating || 'N/A'} ★ | {u.completedTurnarounds || 0} ops)
                      </option>
                    ))}
                  </select>

                  {/* Recommendation based on ratings */}
                  <div className="mt-1 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">Recommended Port Agents</span>
                    <div className="grid grid-cols-2 gap-2">
                      {users.filter(u => u.role === 'PORT_AGENT').sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 2).map(agent => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => setAssignedAgentId(agent.id)}
                          className={`p-1.5 rounded-md border text-left transition-all text-[11px] cursor-pointer ${
                            assignedAgentId === agent.id
                              ? 'border-[#6C4CE1] bg-[#6C4CE1]/10/50 text-[#6C4CE1]'
                              : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span className="truncate">{agent.name}</span>
                            <span className="text-amber-500 tabular-nums text-[10px] shrink-0">★{agent.rating}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">{agent.specialty}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Operational Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VesselStatus)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Arriving">Arriving</option>
                    <option value="Berthed">Berthed</option>
                    <option value="Cargo Operations">Cargo Operations</option>
                    <option value="Departing">Departing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Estimated Arrival (ETA)</label>
                  <input
                    type="datetime-local"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Estimated Departure (ETD)</label>
                  <input
                    type="datetime-local"
                    value={etd}
                    onChange={(e) => setEtd(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  Register Vessel log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vessel Modal */}
      {editingVessel && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Ship className="h-5 w-5 text-[#6C4CE1]" />
                <span>Correct Vessel Registration Log</span>
              </h4>
              <button 
                onClick={() => setEditingVessel(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Vessel Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Queen Elizabeth Tanker"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">IMO Number *</label>
                  <input
                    type="text"
                    required
                    value={editImo}
                    onChange={(e) => setEditImo(e.target.value)}
                    placeholder="e.g. 9482154"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Call Sign *</label>
                  <input
                    type="text"
                    required
                    value={editCallSign}
                    onChange={(e) => setEditCallSign(e.target.value)}
                    placeholder="e.g. ZQD44"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Vessel Type</label>
                  <select
                    value={editVesselType}
                    onChange={(e) => setEditVesselType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer bg-white text-xs"
                  >
                    <option value="Container Ship">Container Ship</option>
                    <option value="LNG Carrier">LNG Carrier</option>
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="Oil Tanker">Oil Tanker</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Ro-Ro Vessel">Ro-Ro Vessel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Flag Registry</label>
                  <input
                    type="text"
                    value={editFlag}
                    onChange={(e) => setEditFlag(e.target.value)}
                    placeholder="e.g. Panama"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Voyage ID Assigned *</label>
                  <input
                    type="text"
                    required
                    value={editVoyageNumber}
                    onChange={(e) => setEditVoyageNumber(e.target.value)}
                    placeholder="e.g. QE-VOY-05"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Gross Tonnage</label>
                  <input
                    type="number"
                    value={editGt}
                    onChange={(e) => setEditGt(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Deadweight Tonnage (DWT)</label>
                  <input
                    type="number"
                    value={editDwt}
                    onChange={(e) => setEditDwt(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Captain Details</label>
                  <input
                    type="text"
                    value={editCaptain}
                    onChange={(e) => setEditCaptain(e.target.value)}
                    placeholder="e.g. Capt. James Hook"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Crew Onboard Count</label>
                  <input
                    type="number"
                    value={editCrewCount}
                    onChange={(e) => setEditCrewCount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Scheduled Entry Port</label>
                  <input
                    type="text"
                    value={editCurrentPort}
                    onChange={(e) => setEditCurrentPort(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Attach Port Agent</label>
                  <select
                    value={editAssignedAgentId}
                    onChange={(e) => setEditAssignedAgentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer text-xs mb-1"
                  >
                    <option value="">-- No Agent Attached (Unassigned) --</option>
                    {users.filter(u => u.role === 'PORT_AGENT').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Rating: {u.rating || 'N/A'} ★ | {u.completedTurnarounds || 0} ops)
                      </option>
                    ))}
                  </select>

                  {/* Recommendation based on ratings */}
                  <div className="mt-1 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">Recommended Port Agents</span>
                    <div className="grid grid-cols-2 gap-2">
                      {users.filter(u => u.role === 'PORT_AGENT').sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 2).map(agent => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => setEditAssignedAgentId(agent.id)}
                          className={`p-1.5 rounded-md border text-left transition-all text-[11px] cursor-pointer ${
                            editAssignedAgentId === agent.id
                              ? 'border-[#6C4CE1] bg-[#6C4CE1]/10/50 text-[#6C4CE1]'
                              : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span className="truncate">{agent.name}</span>
                            <span className="text-amber-500 tabular-nums text-[10px] shrink-0">★{agent.rating}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">{agent.specialty}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Operational Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as VesselStatus)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none cursor-pointer bg-white text-xs"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Arriving">Arriving</option>
                    <option value="Berthed">Berthed</option>
                    <option value="Cargo Operations">Cargo Operations</option>
                    <option value="Departing">Departing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Estimated Arrival (ETA)</label>
                  <input
                    type="datetime-local"
                    value={editEta}
                    onChange={(e) => setEditEta(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Estimated Departure (ETD)</label>
                  <input
                    type="datetime-local"
                    value={editEtd}
                    onChange={(e) => setEditEtd(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVessel(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {vesselToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Vessel Record</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the vessel record for <span className="font-bold text-slate-800">{vesselToDelete.name}</span>? This action cannot be undone and will remove the vessel from the active registry.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setVesselToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteVessel?.(vesselToDelete.id);
                  setVesselToDelete(null);
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
