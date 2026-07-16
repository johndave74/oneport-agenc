import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { CrewMember, Vessel } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface CrewViewProps {
  crewMembers: CrewMember[];
  vessels: Vessel[];
  onAddCrewMember: (crew: Omit<CrewMember, 'id'>) => void;
  onEditCrewMember: (crew: CrewMember) => void;
  onDeleteCrewMember: (id: string) => void;
}

interface CrewFormState {
  fullName: string;
  rank: string;
  vesselId: string;
  nationality: string;
  seamanBookNumber: string;
  passportNumber: string;
  signOnDate: string;
  signOffDate: string;
  status: CrewMember['status'];
  contactPhone: string;
  notes: string;
}

const emptyForm: CrewFormState = {
  fullName: '', rank: '', vesselId: '', nationality: '', seamanBookNumber: '',
  passportNumber: '', signOnDate: '', signOffDate: '', status: 'Scheduled', contactPhone: '', notes: ''
};

export default function CrewView({ crewMembers, vessels, onAddCrewMember, onEditCrewMember, onDeleteCrewMember }: CrewViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CrewFormState>(emptyForm);
  const [crewToDelete, setCrewToDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = crewMembers.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.vesselName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (c: CrewMember) => {
    setEditingId(c.id);
    setForm({
      fullName: c.fullName, rank: c.rank, vesselId: c.vesselId || '', nationality: c.nationality || '',
      seamanBookNumber: c.seamanBookNumber || '', passportNumber: c.passportNumber || '',
      signOnDate: c.signOnDate || '', signOffDate: c.signOffDate || '', status: c.status,
      contactPhone: c.contactPhone || '', notes: c.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.rank) return;
    const vessel = vessels.find(v => v.id === form.vesselId);
    const payload = {
      fullName: form.fullName, rank: form.rank, vesselId: form.vesselId || undefined,
      vesselName: vessel?.vesselName, nationality: form.nationality || undefined,
      seamanBookNumber: form.seamanBookNumber || undefined, passportNumber: form.passportNumber || undefined,
      signOnDate: form.signOnDate || undefined, signOffDate: form.signOffDate || undefined,
      status: form.status, contactPhone: form.contactPhone || undefined, notes: form.notes || undefined
    };
    if (editingId) {
      onEditCrewMember({ id: editingId, ...payload });
    } else {
      onAddCrewMember(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search crew name, rank, vessel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
          />
        </div>
        <button
          onClick={openAddModal}
          className="w-full md:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-150 shadow-md shadow-slate-900/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Crew Member</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No crew members recorded"
            description="Add crew members and link them to a vessel to track sign-on/sign-off status."
            action={{ label: 'Add Crew Member', onClick: openAddModal }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-5">Crew Member</th>
                  <th className="py-3 px-4">Vessel</th>
                  <th className="py-3 px-4">Nationality / Documents</th>
                  <th className="py-3 px-4">Sign On / Off</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800 text-sm block">{c.fullName}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 inline-block tabular-nums font-semibold mt-1">{c.rank}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{c.vesselName || <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="py-4 px-4 tabular-nums text-[10px] text-slate-500 space-y-0.5">
                      <div>{c.nationality || '—'}</div>
                      <div>Seaman Book: {c.seamanBookNumber || '—'}</div>
                    </td>
                    <td className="py-4 px-4 tabular-nums text-[10px] text-slate-600 space-y-0.5">
                      <div className="text-emerald-700 font-semibold">On: {c.signOnDate || '—'}</div>
                      <div className="text-amber-700 font-semibold">Off: {c.signOffDate || '—'}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Onboard' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'Signed Off' ? 'bg-slate-100 text-slate-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openEditModal(c)} className="p-1.5 text-slate-400 hover:text-[#2D1B69] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit Crew Member">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setCrewToDelete({ id: c.id, name: c.fullName })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Remove Crew Member">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Users className="h-5 w-5 text-[#6C4CE1]" />
                <span>{editingId ? 'Edit Crew Member' : 'Add Crew Member'}</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Full Name *</label>
                  <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Rank / Position *</label>
                  <input type="text" required value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="e.g. Master, Chief Officer, AB Seaman" className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Vessel</label>
                  <select value={form.vesselId} onChange={(e) => setForm({ ...form, vesselId: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    <option value="">-- Unassigned --</option>
                    {vessels.map(v => <option key={v.id} value={v.id}>{v.vesselName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Nationality</label>
                  <input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Seaman's Book Number</label>
                  <input type="text" value={form.seamanBookNumber} onChange={(e) => setForm({ ...form, seamanBookNumber: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Passport Number</label>
                  <input type="text" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Sign On Date</label>
                  <input type="date" value={form.signOnDate} onChange={(e) => setForm({ ...form, signOnDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Sign Off Date</label>
                  <input type="date" value={form.signOffDate} onChange={(e) => setForm({ ...form, signOffDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CrewMember['status'] })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Onboard">Onboard</option>
                    <option value="Signed Off">Signed Off</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Contact Phone</label>
                  <input type="text" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer">{editingId ? 'Save Changes' : 'Add Crew Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {crewToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Remove Crew Member</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800">{crewToDelete.name}</span> from the crew roster? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={() => setCrewToDelete(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={() => { onDeleteCrewMember(crewToDelete.id); setCrewToDelete(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-md shadow-rose-900/10">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
