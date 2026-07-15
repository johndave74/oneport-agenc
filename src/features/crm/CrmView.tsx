import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  Star, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Ship, 
  User, 
  Award, 
  Activity, 
  X,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { User as UserType, Vessel, UserRole } from '@/types';

interface CrmViewProps {
  users: UserType[];
  vessels: Vessel[];
  currentUser: UserType;
  onSendMessage: (channelId: string, content: string) => void;
  onUpdateVessel: (vessel: Vessel) => void;
  onAddNotification: (userId: string, content: string, type: 'System' | 'Alert' | 'Reminder') => void;
  onAddAuditLog: (action: string, details: string) => void;
}

export default function CrmView({ 
  users, 
  vessels, 
  currentUser,
  onSendMessage,
  onUpdateVessel,
  onAddNotification,
  onAddAuditLog
}: CrmViewProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [portFilter, setPortFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals / Interactivity
  const [selectedAgent, setSelectedAgent] = useState<UserType | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Form states
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [chatText, setChatText] = useState('');
  const [selectedVesselId, setSelectedVesselId] = useState('');

  // Alerts / Feedback
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showAlert = (text: string, type: 'success' | 'info' = 'success') => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  // Get all unique supported ports from agents
  const allPorts = Array.from(
    new Set(
      users.flatMap(u => u.locations || [])
    )
  ).filter(Boolean).sort();

  // Filtered list
  const filteredUsers = users.filter(u => {
    // Exclude admins and the current logged-in user from the active lists to prevent confusion
    if (u.id === currentUser.id) return false;
    
    // Under the Agent Directory, a user of a role should not see other users of that same role
    if (currentUser.role !== 'ADMIN' && u.role === currentUser.role) {
      return false;
    }

    if (u.role === 'ADMIN' && roleFilter !== 'ADMIN') {
      if (roleFilter !== 'ALL') return false;
    }

    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.locations || []).some(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesPort = portFilter === 'ALL' || (u.locations || []).includes(portFilter);
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesPort && matchesStatus;
  });

  // Handle direct simulated email
  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !emailSubject.trim() || !emailBody.trim()) return;

    // Simulate sending email
    onAddAuditLog('Email Dispatched', `Sent email to ${selectedAgent.name} (${selectedAgent.role}): "${emailSubject}"`);
    onAddNotification(
      currentUser.id, 
      `Direct dispatch log: Simulated email dispatched successfully to ${selectedAgent.name}.`, 
      'System'
    );

    showAlert(`Simulated email dispatched to ${selectedAgent.email}! Check notifications for verification.`);
    setEmailModalOpen(false);
    setEmailSubject('');
    setEmailBody('');
  };

  // Handle direct messaging (simulates writing into a general channel or direct thread)
  const handleSendChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !chatText.trim()) return;

    // Add real message to General advisory so it appears in Communications view
    onSendMessage('general', `[Direct message to ${selectedAgent.name}]: ${chatText}`);
    
    onAddAuditLog('Chat Initiated', `Dispatched instant message thread with ${selectedAgent.name}`);
    onAddNotification(
      currentUser.id, 
      `Message sent: Instant chat message logged in communication portal with ${selectedAgent.name}.`, 
      'Reminder'
    );

    showAlert(`Simulated direct message posted to Advisory channel with ${selectedAgent.name}!`);
    setChatModalOpen(false);
    setChatText('');
  };

  // Handle assigning a vessel to the selected Port Agent
  const handleAssignVesselSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !selectedVesselId) return;

    const matchedVessel = vessels.find(v => v.id === selectedVesselId);
    if (!matchedVessel) return;

    const updatedVessel: Vessel = {
      ...matchedVessel,
      assignedPortAgentId: selectedAgent.id,
      assignedPortAgentName: selectedAgent.name
    };

    onUpdateVessel(updatedVessel);

    onAddAuditLog(
      'Agent Affiliated', 
      `Assigned Port Agent ${selectedAgent.name} to vessel ${matchedVessel.vesselName}`
    );

    onAddNotification(
      currentUser.id, 
      `Affiliation Success: Port Agent ${selectedAgent.name} (★${selectedAgent.rating}) assigned to ${matchedVessel.vesselName}.`, 
      'System'
    );

    showAlert(`Successfully affiliated Port Agent ${selectedAgent.name} with ${matchedVessel.vesselName}!`);
    setAssignModalOpen(false);
    setSelectedVesselId('');
  };

  // Automated matchmaker match recommendation helper
  const recommendedAgents = users
    .filter(u => {
      if (u.id === currentUser.id) return false;
      if (currentUser.role !== 'ADMIN' && u.role === currentUser.role) return false;
      if (!u.rating) return false;
      
      // Port Agent sees Ship Agents (their main charterer counterparts).
      // Other roles see Port Agents (their local in-port counterparts).
      if (currentUser.role === 'PORT_AGENT') {
        return u.role === 'SHIP_AGENT';
      } else {
        return u.role === 'PORT_AGENT';
      }
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className="space-y-6">
      
      {/* Alert toast notifier */}
      {alertMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white rounded-xl shadow-xl p-4 flex items-center space-x-3 border border-[#6C4CE1]/30 animate-bounce">
          <CheckCircle className="h-5 w-5 text-[#6C4CE1] shrink-0" />
          <span className="text-xs font-semibold">{alertMessage.text}</span>
        </div>
      )}

      {/* Hero matchmaker match helper header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-[#004d40] text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 h-44 w-44 bg-[#6C4CE1]/10 rounded-full  pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <span className="bg-[#6C4CE1]/20 border border-[#6C4CE1]/40 text-[#00b0ff] text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full inline-block">
              Maritime CRM Network
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Agent Directory & Affiliation Center</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Find, assess, and affiliate authorized ship brokers, protective advisors, and local port coordinators. Match agents based on support terminals, localized rating matrices, and historic voyage turnaround speeds.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 shrink-0 w-full md:w-auto max-w-sm">
            <div className="flex items-center space-x-2 mb-2.5">
              <Sparkles className="h-4 w-4 text-[#6C4CE1]" />
              <span className="text-[11px] font-bold tracking-wider text-[#6C4CE1] uppercase font-mono">
                {currentUser.role === 'PORT_AGENT' ? 'Top Rated Charterer Match' : 'Top Rated Coordinator Match'}
              </span>
            </div>
            {recommendedAgents[0] && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">{recommendedAgents[0].name}</span>
                  <span className="text-amber-400 font-bold flex items-center">
                    <Star className="h-3 w-3 fill-amber-400 mr-0.5" /> {recommendedAgents[0].rating}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">{recommendedAgents[0].specialty}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(recommendedAgents[0].locations || []).slice(0, 2).map(p => (
                    <span key={p} className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-300">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search query */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agent name, specialty, or terminal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
            />
          </div>

          {/* Filter by Role */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="ALL">All Agency Roles</option>
              {currentUser.role !== 'PORT_AGENT' && <option value="PORT_AGENT">Port Agents (In-Port Logistics)</option>}
              {currentUser.role !== 'SHIP_AGENT' && <option value="SHIP_AGENT">Ship Agents (Owners Representative)</option>}
              {currentUser.role !== 'PROTECTIVE_AGENT' && <option value="PROTECTIVE_AGENT">Protective Agents (OPA Auditors)</option>}
            </select>
          </div>

          {/* Filter by Port Support */}
          <div>
            <select
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="ALL">All Terminal Ports</option>
              {allPorts.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available (Active Duty)</option>
              <option value="Busy">Busy (Engaged)</option>
              <option value="On Voyage">On Voyage (Transit Support)</option>
            </select>
          </div>

        </div>

        {/* Counter Header */}
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold font-mono pt-1">
          <span>SHOWING {filteredUsers.length} CERTIFIED REGIONAL AGENTS</span>
          <span className="text-slate-300">|</span>
          <span>CURRENT SIMULATION MODE: <span className="text-[#6C4CE1] uppercase">{currentUser.role.replace('_', ' ')}</span></span>
        </div>
      </div>

      {/* CRM Agent Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((agent) => {
          const isPortAgent = agent.role === 'PORT_AGENT';
          const isShipAgent = agent.role === 'SHIP_AGENT';
          const isProtectiveAgent = agent.role === 'PROTECTIVE_AGENT';

          return (
            <div 
              key={agent.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card top banner header */}
              <div className="p-5 space-y-3.5">
                <div className="flex justify-between items-start">
                  
                  {/* Avatar or Icon designation */}
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      isPortAgent ? 'bg-[#6C4CE1]/10 text-[#6C4CE1]' :
                      isShipAgent ? 'bg-sky-50 text-sky-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {isPortAgent && <Activity className="h-5 w-5" />}
                      {isShipAgent && <Ship className="h-5 w-5" />}
                      {isProtectiveAgent && <Shield className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{agent.name}</h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${
                          isPortAgent ? 'bg-[#6C4CE1]/10/50 text-[#6C4CE1] border-[#6C4CE1]/20/50' :
                          isShipAgent ? 'bg-sky-50/50 text-sky-700 border-sky-100/50' :
                          'bg-purple-50/50 text-purple-700 border-purple-100/50'
                        }`}>
                          {agent.role.replace('_', ' ')}
                        </span>
                        
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          agent.status === 'Available' ? 'bg-emerald-500' :
                          agent.status === 'Busy' ? 'bg-amber-500' :
                          'bg-indigo-500'
                        }`} />
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">{agent.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  {agent.rating && (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-lg px-2 py-1 text-center flex items-center space-x-1 shrink-0">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-mono text-[11px] font-bold text-amber-800">{agent.rating}</span>
                    </div>
                  )}

                </div>

                {/* Specialty */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Specialty & Domain</span>
                  <p className="text-xs text-slate-700 font-medium">{agent.specialty || 'General Port Operations'}</p>
                </div>

                {/* Supported Locations */}
                {agent.locations && agent.locations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Support Terminal Locations</span>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.locations.map(port => (
                        <span 
                          key={port}
                          className="inline-flex items-center text-[9px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/60 rounded px-1.5 py-0.5"
                        >
                          <MapPin className="h-2.5 w-2.5 text-slate-400 mr-1 shrink-0" />
                          <span>{port}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Indicators */}
                <div className="pt-2 border-t border-slate-100/60 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate" title={agent.email}>{agent.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 truncate">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{agent.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Turnaround History stats */}
                {agent.completedTurnarounds !== undefined && (
                  <div className="bg-slate-50/50 border border-slate-150 rounded-lg p-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Historic Turnaround operations:</span>
                    <span className="font-bold font-mono text-slate-800 flex items-center">
                      <Award className="h-3.5 w-3.5 text-[#6C4CE1] mr-1" />
                      {agent.completedTurnarounds} Voyages
                    </span>
                  </div>
                )}

              </div>

              {/* Action Buttons footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-4.5 grid grid-cols-3 gap-2">
                <button 
                  onClick={() => {
                    setSelectedAgent(agent);
                    setEmailModalOpen(true);
                  }}
                  className="py-2 px-1 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                  title="Simulate sending email"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </button>

                <button 
                  onClick={() => {
                    setSelectedAgent(agent);
                    setChatModalOpen(true);
                  }}
                  className="py-2 px-1 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                  title="Simulate instant direct messaging"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Message</span>
                </button>

                {isPortAgent && (
                  <button 
                    onClick={() => {
                      setSelectedAgent(agent);
                      setAssignModalOpen(true);
                    }}
                    className="py-2 px-1 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors shadow-sm"
                    title="Affiliate with one of your active vessel registries"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Affiliate</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
            <User className="h-10 w-10 text-slate-300 mx-auto" />
            <h5 className="font-bold text-slate-700 text-sm">No Matching Agents Found</h5>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Refine your terminals filter, switch statuses, or clear the search query to find localized operators.
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setPortFilter('ALL');
                setStatusFilter('ALL');
              }} 
              className="text-xs text-[#6C4CE1] font-bold underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Email Simulation Modal */}
      {emailModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <Mail className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <h3 className="font-bold text-sm text-slate-850">Simulate Email to {selectedAgent.name}</h3>
              </div>
              <button 
                onClick={() => setEmailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recipient</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedAgent.name} <${selectedAgent.email}>`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vessel scheduling coordination or PDA request"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Message Content</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Draft your operational directives or questions here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Simulated Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Simulation Modal */}
      {chatModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <h3 className="font-bold text-sm text-slate-850">Direct Message to {selectedAgent.name}</h3>
              </div>
              <button 
                onClick={() => setChatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSendChatSubmit} className="p-5 space-y-4">
              <div className="bg-[#6C4CE1]/10 border border-[#6C4CE1]/20 text-[#004d40] p-3 rounded-lg text-xs">
                Sending a direct message here will post an authenticated channel message logged as <strong>{currentUser.name}</strong> referencing this coordinator, accessible in the Communication panel.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Instant Chat Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder={`Hi ${selectedAgent.name.split(' ')[0]}, can you confirm pilotage booking for our incoming turnaround vessels?`}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChatModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Direct Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Affiliation / Vessel Assignment Modal */}
      {assignModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <LinkIcon className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <h3 className="font-bold text-sm text-slate-850">Affiliate Port Agent to Vessel</h3>
              </div>
              <button 
                onClick={() => setAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAssignVesselSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Port Agent</label>
                <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="h-8 w-8 rounded-full bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center font-bold text-xs">
                    {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">{selectedAgent.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Supports: {selectedAgent.locations?.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Matchmaking recommendation feedback */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Turnaround Vessel Registry</label>
                <select
                  required
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Choose Vessel registry to affiliate --</option>
                  {vessels.map(v => {
                    const isLocationMatch = (selectedAgent.locations || []).includes(v.currentPort);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.vesselName} (Current terminal: {v.currentPort}) {isLocationMatch ? '★ MATCH' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400">
                  Vessels flagged with <strong className="text-[#6C4CE1]">★ MATCH</strong> are bound to or berthed at port terminals actively covered by {selectedAgent.name}.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedVesselId}
                  className={`py-2 px-5 font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm ${
                    selectedVesselId 
                      ? 'bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Affiliate Port Agent</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
