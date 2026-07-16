import React, { useState } from 'react';
import { Handshake, Plus, Trash2, Edit2, Search, Mail, Phone } from 'lucide-react';
import { Partner, PartnerType } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface PartnersViewProps {
  partners: Partner[];
  onAddPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
}

const PARTNER_TYPES: PartnerType[] = ['Principal', 'Vendor', 'Port Authority', 'Terminal', 'Client'];

interface PartnerFormState {
  name: string;
  type: PartnerType;
  contactName: string;
  email: string;
  phone: string;
  portsCovered: string;
  notes: string;
}

const emptyForm: PartnerFormState = { name: '', type: 'Principal', contactName: '', email: '', phone: '', portsCovered: '', notes: '' };

export default function PartnersView({ partners, onAddPartner, onEditPartner, onDeletePartner }: PartnersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PartnerType | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerFormState>(emptyForm);
  const [partnerToDelete, setPartnerToDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.contactName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (p: Partner) => {
    setEditingId(p.id);
    setForm({
      name: p.name, type: p.type, contactName: p.contactName || '', email: p.email || '',
      phone: p.phone || '', portsCovered: (p.portsCovered || []).join(', '), notes: p.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const payload = {
      name: form.name, type: form.type, contactName: form.contactName || undefined,
      email: form.email || undefined, phone: form.phone || undefined,
      portsCovered: form.portsCovered ? form.portsCovered.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      notes: form.notes || undefined
    };
    if (editingId) {
      const existing = partners.find(p => p.id === editingId);
      if (existing) onEditPartner({ ...existing, ...payload });
    } else {
      onAddPartner(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search partner or contact name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as PartnerType | 'All')} className="w-full sm:w-auto border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
            <option value="All">All Types</option>
            {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-150 shadow-md shadow-slate-900/10 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Add Partner</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No partners recorded"
            description="Add principals, vendors, port authorities, terminals or clients to build your partner directory."
            action={{ label: 'Add Partner', onClick: openAddModal }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-5">Partner</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Ports Covered</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800 text-sm block">{p.name}</span>
                      {p.notes && <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-xs">{p.notes}</span>}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] text-[#2D1B69] bg-[#6C4CE1]/10 rounded px-1.5 py-0.5 inline-block font-bold">{p.type}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 space-y-0.5">
                      {p.contactName && <div className="font-semibold">{p.contactName}</div>}
                      {p.email && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Mail className="h-3 w-3" />{p.email}</div>}
                      {p.phone && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Phone className="h-3 w-3" />{p.phone}</div>}
                      {!p.contactName && !p.email && !p.phone && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-4 px-4 text-[10px] text-slate-500 font-mono">{(p.portsCovered || []).join(', ') || '—'}</td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openEditModal(p)} className="p-1.5 text-slate-400 hover:text-[#2D1B69] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit Partner">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setPartnerToDelete({ id: p.id, name: p.name })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Delete Partner">
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
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Handshake className="h-5 w-5 text-[#6C4CE1]" />
                <span>{editingId ? 'Edit Partner' : 'Add Partner'}</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Partner Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PartnerType })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Contact Name</label>
                  <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Ports Covered</label>
                  <input type="text" value={form.portsCovered} onChange={(e) => setForm({ ...form, portsCovered: e.target.value })} placeholder="comma-separated" className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer">{editingId ? 'Save Changes' : 'Add Partner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {partnerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Partner</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">{partnerToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={() => setPartnerToDelete(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={() => { onDeletePartner(partnerToDelete.id); setPartnerToDelete(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-md shadow-rose-900/10">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
