import React, { useState } from 'react';
import { FileStack, Plus, Trash2, Search } from 'lucide-react';
import { Invoice, InvoiceStatus, Voyage, Partner } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface InvoicesViewProps {
  invoices: Invoice[];
  voyages: Voyage[];
  partners: Partner[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onUpdateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  onDeleteInvoice: (id: string) => void;
  userName: string;
}

interface InvoiceFormState {
  voyageId: string;
  partnerId: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  notes: string;
}

const emptyForm: InvoiceFormState = { voyageId: '', partnerId: '', amount: 0, currency: 'USD', issueDate: '', dueDate: '', notes: '' };

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-100 text-slate-800',
  Sent: 'bg-amber-100 text-amber-800',
  Paid: 'bg-emerald-100 text-emerald-800',
  Overdue: 'bg-rose-100 text-rose-800',
  Cancelled: 'bg-slate-100 text-slate-400'
};

export default function InvoicesView({ invoices, voyages, partners, onAddInvoice, onUpdateInvoiceStatus, onDeleteInvoice, userName }: InvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<InvoiceFormState>(emptyForm);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = invoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => { setForm(emptyForm); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.voyageId || !form.amount || !form.issueDate || !form.dueDate) return;
    const voyage = voyages.find(v => v.id === form.voyageId);
    const partner = partners.find(p => p.id === form.partnerId);
    if (!voyage) return;
    onAddInvoice({
      invoiceNumber: `INV-${Date.now()}`,
      voyageId: form.voyageId, voyageNumber: voyage.voyageNumber,
      partnerId: form.partnerId || undefined, partnerName: partner?.name,
      amount: Number(form.amount), currency: form.currency, status: 'Draft',
      issueDate: form.issueDate, dueDate: form.dueDate, notes: form.notes || undefined,
      createdBy: userName
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, voyage, partner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none"
          />
        </div>
        <button onClick={openAddModal} className="w-full md:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all duration-150 shadow-md shadow-slate-900/10 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="No invoices recorded"
            description="Create invoices linked to a port call and, optionally, the billed-to partner."
            action={{ label: 'Create Invoice', onClick: openAddModal }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-4">Port Call</th>
                  <th className="py-3 px-4">Billed To</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 tabular-nums font-bold text-slate-800">{i.invoiceNumber}</td>
                    <td className="py-4 px-4 text-slate-600">{i.voyageNumber}</td>
                    <td className="py-4 px-4 text-slate-600">{i.partnerName || <span className="text-slate-400">—</span>}</td>
                    <td className="py-4 px-4 tabular-nums font-bold text-slate-800">{i.currency} {i.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 tabular-nums text-[10px] text-slate-500">{i.dueDate}</td>
                    <td className="py-4 px-4 text-center">
                      <select
                        value={i.status}
                        onChange={(e) => onUpdateInvoiceStatus(i.id, e.target.value as InvoiceStatus)}
                        className={`border-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none ${STATUS_COLORS[i.status]}`}
                      >
                        {(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'] as InvoiceStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button onClick={() => setInvoiceToDelete({ id: i.id, name: i.invoiceNumber })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Delete Invoice">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
                <FileStack className="h-5 w-5 text-[#6C4CE1]" />
                <span>Create Invoice</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Port Call *</label>
                  <select required value={form.voyageId} onChange={(e) => setForm({ ...form, voyageId: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    <option value="">-- Select Port Call --</option>
                    {voyages.map(v => <option key={v.id} value={v.id}>{v.vesselName} — {v.voyageNumber}</option>)}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Billed To (Partner)</label>
                  <select value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    <option value="">-- None --</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Amount *</label>
                  <input type="number" required step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Currency</label>
                  <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Issue Date *</label>
                  <input type="date" required value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Due Date *</label>
                  <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Invoice</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">{invoiceToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={() => setInvoiceToDelete(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={() => { onDeleteInvoice(invoiceToDelete.id); setInvoiceToDelete(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-md shadow-rose-900/10">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
