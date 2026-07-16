import React, { useState } from 'react';
import { Receipt, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { Tariff, Partner } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface TariffsViewProps {
  tariffs: Tariff[];
  partners: Partner[];
  onAddTariff: (tariff: Omit<Tariff, 'id'>) => void;
  onEditTariff: (tariff: Tariff) => void;
  onDeleteTariff: (id: string) => void;
}

interface TariffFormState {
  serviceCategory: string;
  description: string;
  port: string;
  vendorId: string;
  rate: number;
  currency: string;
  unit: string;
  effectiveDate: string;
  notes: string;
}

const emptyForm: TariffFormState = { serviceCategory: '', description: '', port: '', vendorId: '', rate: 0, currency: 'USD', unit: '', effectiveDate: '', notes: '' };

export default function TariffsView({ tariffs, partners, onAddTariff, onEditTariff, onDeleteTariff }: TariffsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TariffFormState>(emptyForm);
  const [tariffToDelete, setTariffToDelete] = useState<{ id: string; name: string } | null>(null);

  const vendors = partners.filter(p => p.type === 'Vendor');

  const filtered = tariffs.filter(t =>
    t.serviceCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.port || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal = (t: Tariff) => {
    setEditingId(t.id);
    setForm({
      serviceCategory: t.serviceCategory, description: t.description || '', port: t.port || '',
      vendorId: t.vendorId || '', rate: t.rate, currency: t.currency, unit: t.unit,
      effectiveDate: t.effectiveDate, notes: t.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceCategory || !form.unit || !form.effectiveDate) return;
    const vendor = vendors.find(v => v.id === form.vendorId);
    const payload = {
      serviceCategory: form.serviceCategory, description: form.description || undefined,
      port: form.port || undefined, vendorId: form.vendorId || undefined, vendorName: vendor?.name,
      rate: Number(form.rate), currency: form.currency, unit: form.unit,
      effectiveDate: form.effectiveDate, notes: form.notes || undefined
    };
    if (editingId) {
      onEditTariff({ id: editingId, ...payload });
    } else {
      onAddTariff(payload);
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
            placeholder="Search service, port, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
          />
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-150 shadow-md shadow-slate-900/10 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Add Tariff</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No tariffs recorded"
            description="Build a rate card of vendor services and standard port charges."
            action={{ label: 'Add Tariff', onClick: openAddModal }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-5">Service</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Port</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800 text-sm block">{t.serviceCategory}</span>
                      {t.description && <span className="text-[10px] text-slate-400 block mt-0.5">{t.description}</span>}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{t.vendorName || <span className="text-slate-400">—</span>}</td>
                    <td className="py-4 px-4 text-slate-600">{t.port || '—'}</td>
                    <td className="py-4 px-4 tabular-nums font-bold text-slate-800">{t.currency} {t.rate.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {t.unit}</span></td>
                    <td className="py-4 px-4 tabular-nums text-[10px] text-slate-500">{t.effectiveDate}</td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openEditModal(t)} className="p-1.5 text-slate-400 hover:text-[#2D1B69] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit Tariff">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setTariffToDelete({ id: t.id, name: t.serviceCategory })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Delete Tariff">
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
                <Receipt className="h-5 w-5 text-[#6C4CE1]" />
                <span>{editingId ? 'Edit Tariff' : 'Add Tariff'}</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Service Category *</label>
                  <input type="text" required value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} placeholder="e.g. Pilotage, Tug Services, Mooring" className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Port</label>
                  <input type="text" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Vendor</label>
                  <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    <option value="">-- No Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Rate *</label>
                  <input type="number" required step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Currency</label>
                  <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Unit *</label>
                  <input type="text" required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. per call, per day, per MT" className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Effective Date *</label>
                  <input type="date" required value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer">{editingId ? 'Save Changes' : 'Add Tariff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tariffToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Tariff</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the tariff for <span className="font-bold text-slate-800">{tariffToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={() => setTariffToDelete(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={() => { onDeleteTariff(tariffToDelete.id); setTariffToDelete(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-md shadow-rose-900/10">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
