import React, { useState, useRef } from 'react';
import { 
  DollarSign, 
  Search, 
  Plus, 
  AlertTriangle, 
  Check, 
  X, 
  Briefcase, 
  Percent, 
  FileCheck,
  TrendingUp,
  Download,
  Receipt,
  Trash2,
  Upload,
  FileText
} from 'lucide-react';
import { Expense, Voyage, UserRole, Document } from '@/types';

interface ExpensesViewProps {
  expenses: Expense[];
  voyages: Voyage[];
  documents?: Document[];
  onUploadDocument?: (doc: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt' | 'version'>) => void;
  onDeleteDocument?: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'submittedBy' | 'submittedAt'>) => void;
  onApproveExpense: (id: string) => void;
  onRejectExpense: (id: string) => void;
  userRole: UserRole;
  userName: string;
}

export default function ExpensesView({ 
  expenses, 
  voyages, 
  documents = [],
  onUploadDocument,
  onDeleteDocument,
  onAddExpense,
  onApproveExpense,
  onRejectExpense,
  userRole,
  userName
}: ExpensesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [voyageFilter, setVoyageFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [accountTypeTab, setAccountTypeTab] = useState<'PDA' | 'FDA'>('PDA'); // PDA = Proforma, FDA = Final Disbursement Account

  // Financial Documents states
  const [docFileName, setDocFileName] = useState('');
  const [docVoyageId, setDocVoyageId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [voyageId, setVoyageId] = useState('');
  const [amount, setAmount] = useState(1500);
  const [estAmount, setEstAmount] = useState(1500);
  const [category, setCategory] = useState<Expense['category']>('Pilotage');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<Expense['status']>('Estimated');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVoyage = voyageFilter === 'All' || exp.voyageId === voyageFilter;
    const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
    
    // In PDA tab show Estimated/Pending, in FDA tab show Approved/Rejected
    const matchesTab = accountTypeTab === 'PDA' 
      ? (exp.status === 'Estimated' || exp.status === 'Pending Approval')
      : (exp.status === 'Approved' || exp.status === 'Rejected');

    return matchesSearch && matchesVoyage && matchesStatus && matchesTab;
  });

  const totalEstimated = expenses.reduce((sum, e) => sum + e.estimatedAmount, 0);
  const totalApprovedActual = expenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
  const totalPendingApproval = expenses.filter(e => e.status === 'Pending Approval').reduce((sum, e) => sum + e.amount, 0);
  const activeOverrunsCount = expenses.filter(e => e.amount > e.estimatedAmount * 1.15).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voyageId || !amount) return;

    onAddExpense({
      voyageId,
      voyageNumber: voyages.find(v => v.id === voyageId)?.voyageNumber || 'TBA',
      amount: Number(amount),
      estimatedAmount: Number(estAmount),
      category,
      status: (userRole === 'SHIP_AGENT' || userRole === 'ADMIN') ? 'Pending Approval' : 'Estimated',
      description: desc
    });

    setVoyageId('');
    setDesc('');
    setShowAddModal(false);
  };

  const handleDocUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName || !docVoyageId) return;
    const v = voyages.find(voy => voy.id === docVoyageId);
    if (!v) return;

    onUploadDocument?.({
      fileName: docFileName,
      fileSize: '350 KB',
      type: 'Invoice',
      voyageId: docVoyageId,
      voyageNumber: v.voyageNumber,
      category: 'Financial Cost Document'
    });

    setDocFileName('');
    setDocVoyageId('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setDocFileName(file.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocFileName(e.target.files[0].name);
    }
  };

  const triggerMockInvoiceDownload = () => {
    const element = window.document.createElement("a");
    const file = new Blob([
      `APEX PORT AGENCY DISBURSEMENT ACCOUNT INVOICE\n`,
      `==============================================\n`,
      `Date Generated: ${new Date().toISOString().substring(0, 10)}\n`,
      `Client Org: Apex Ocean Logistics Ltd\n`,
      `Authorized By: ${userName} (${userRole})\n\n`,
      `FINANCIAL SUMMARY:\n`,
      `----------------------------------------------\n`,
      `Total Estimated PDA Costs: $${totalEstimated.toLocaleString()}\n`,
      `Total Verified Approved FDA Costs: $${totalApprovedActual.toLocaleString()}\n`,
      `Outstanding Audits (Pending): $${totalPendingApproval.toLocaleString()}\n`,
      `Variance Rate: +${Math.round(((totalApprovedActual - totalEstimated)/totalEstimated)*100) || 0}%\n\n`,
      `BILLABLE ITEMS STATEMENT:\n`,
      expenses.map(e => ` - ${e.category} (${e.voyageNumber}): $${e.amount} [PDA Est: $${e.estimatedAmount}] (${e.status})`).join('\n')
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `FDA_Invoice_Apex_${Date.now()}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      
      {/* Financial Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 hover:shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide uppercase">Proforma PDA Estimate</span>
            <p className="text-xl font-extrabold text-slate-800">${totalEstimated.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#6C4CE1]/10 text-[#2D1B69]">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 hover:shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide uppercase">Approved Final FDA Cost</span>
            <p className="text-xl font-extrabold text-slate-800">${totalApprovedActual.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 hover:shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide uppercase">Costs Awaiting Approval</span>
            <p className="text-xl font-extrabold text-slate-800">${totalPendingApproval.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 hover:shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide uppercase">High Variance Flags</span>
            <p className="text-xl font-extrabold text-rose-600">{activeOverrunsCount} Events</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Disbursment Tab toggle controls */}
      <div className="bg-white border border-slate-200 p-4.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        
        {/* Tab switchers */}
        <div className="flex bg-slate-100 rounded-lg p-1 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setAccountTypeTab('PDA')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              accountTypeTab === 'PDA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Proforma (PDA Account)
          </button>
          <button
            onClick={() => setAccountTypeTab('FDA')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              accountTypeTab === 'FDA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Finalized (FDA Account)
          </button>
        </div>

        {/* Global Selects and Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <select
            value={voyageFilter}
            onChange={(e) => setVoyageFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-lg py-1.5 px-3 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
          >
            <option value="All">All Voyage Registers</option>
            {voyages.map(v => (
              <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>
            ))}
          </select>

          <button
            onClick={triggerMockInvoiceDownload}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Download full FDA report"
          >
            <Download className="h-4 w-4" />
            <span>Generate PDF Invoice</span>
          </button>

          {/* Port Agents and Ship Agents can book costs */}
          {(userRole === 'PORT_AGENT' || userRole === 'SHIP_AGENT' || userRole === 'ADMIN') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center space-x-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record Cost Line</span>
            </button>
          )}
        </div>
      </div>

      {/* cost statement Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-5">Expense Classification</th>
                <th className="py-3 px-4">Voyage Assignment</th>
                <th className="py-3 px-4 text-right">Proforma Estimate</th>
                <th className="py-3 px-4 text-right">Actual Statement</th>
                <th className="py-3 px-4 text-right">Variance Rate</th>
                <th className="py-3 px-4 text-center">Audit Status</th>
                <th className="py-3 px-5 text-right">Disbursement Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-400">
                    No active expenses found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const overrunVal = exp.amount - exp.estimatedAmount;
                  const overrunPercent = exp.estimatedAmount > 0 
                    ? Math.round((overrunVal / exp.estimatedAmount) * 100)
                    : 0;
                  const isHighOverrun = overrunPercent > 15;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div>
                          <span className="font-bold text-slate-800 block">{exp.category}</span>
                          <span className="text-[10px] text-slate-400 leading-normal block max-w-sm">{exp.description}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[#6C4CE1]/10 text-[#2D1B69] font-semibold border border-[#6C4CE1]/20">
                          {exp.voyageNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600">
                        ${exp.estimatedAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${exp.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {overrunVal === 0 ? (
                          <span className="text-slate-400">0%</span>
                        ) : overrunVal > 0 ? (
                          <span className={`font-semibold ${isHighOverrun ? 'text-rose-600' : 'text-amber-600'}`}>
                            +{overrunPercent}% {isHighOverrun && '⚠'}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">
                            {overrunPercent}%
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            exp.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                            exp.status === 'Pending Approval' ? 'bg-amber-100 text-amber-850 animate-pulse' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {exp.status}
                          </span>
                          {exp.status === 'Pending Approval' && (
                            <span className="text-[9px] text-amber-600 font-bold block leading-none font-sans select-none">
                              Awaiting Protective Agent Approval
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {/* Protective Agents and Admin review costs */}
                        {exp.status === 'Pending Approval' && (userRole === 'PROTECTIVE_AGENT' || userRole === 'ADMIN') ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onRejectExpense(exp.id)}
                              className="bg-slate-50 hover:bg-rose-100 hover:text-rose-700 text-slate-500 border border-slate-200 p-1 rounded transition-colors cursor-pointer"
                              title="Reject Overrun Charge"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onApproveExpense(exp.id)}
                              className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded p-1 shadow-sm transition-colors cursor-pointer"
                              title="Approve Charge"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            {exp.status === 'Approved' ? `Approved by David M.` : 
                             exp.status === 'Rejected' ? 'Charge Rejected' : 'Read-only / Estimated'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Financial Document Repository */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#6C4CE1]" />
            <span>Financial Document & Receipt Repository</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Upload, manage, and verify official port invoices, supplier quotes, customs clearance receipts, and bunkering vouchers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form Box */}
          <div className="lg:col-span-1 bg-slate-50/50 border border-slate-200/65 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-700 mb-3">Upload Financial Voucher</h4>
            <form onSubmit={handleDocUploadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Voyage *</label>
                <select
                  value={docVoyageId}
                  onChange={(e) => setDocVoyageId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Choose Voyage --</option>
                  {voyages.map(v => (
                    <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Title / File Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Pilotage Invoice, Tug Receipt"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  required
                />
              </div>

              {/* Drag and Drop Area */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                  isDragging 
                    ? 'border-[#6C4CE1] bg-[#6C4CE1]/5' 
                    : docFileName 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
                <Upload className={`h-6 w-6 ${docFileName ? 'text-emerald-500' : 'text-slate-400'}`} />
                {docFileName ? (
                  <span className="text-[11px] font-semibold text-emerald-700 break-all px-2 block">{docFileName}</span>
                ) : (
                  <div className="text-[10px] text-slate-500">
                    <span className="font-semibold text-[#6C4CE1]">Click to upload</span> or drag & drop files
                  </div>
                )}
                <span className="text-[9px] text-slate-400">PDF, PNG, JPG, or Excel up to 10MB</span>
              </div>

              <button
                type="submit"
                disabled={!docFileName || !docVoyageId}
                className={`w-full py-2 text-xs font-bold text-white rounded-lg flex items-center justify-center space-x-1.5 shadow-md shadow-slate-900/10 cursor-pointer transition-all ${
                  (!docFileName || !docVoyageId) 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-[#6C4CE1] hover:bg-[#6C4CE1]/90'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Financial Files</span>
              </button>
            </form>
          </div>

          {/* Document List Table */}
          <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="py-2.5 px-4">Financial Document Name</th>
                    <th className="py-2.5 px-3">Voyage</th>
                    <th className="py-2.5 px-3">Uploaded By</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {documents.filter(doc => 
                    doc.category === 'Financial Cost Document' || 
                    doc.type === 'Customs Document' ||
                    doc.fileName.toLowerCase().includes('invoice') || 
                    doc.fileName.toLowerCase().includes('receipt') || 
                    doc.fileName.toLowerCase().includes('bill') ||
                    doc.fileName.toLowerCase().includes('pda') ||
                    doc.fileName.toLowerCase().includes('fda')
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          <span>No financial documents uploaded yet.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    documents.filter(doc => 
                      doc.category === 'Financial Cost Document' || 
                      doc.type === 'Customs Document' ||
                      doc.fileName.toLowerCase().includes('invoice') || 
                      doc.fileName.toLowerCase().includes('receipt') || 
                      doc.fileName.toLowerCase().includes('bill') ||
                      doc.fileName.toLowerCase().includes('pda') ||
                      doc.fileName.toLowerCase().includes('fda')
                    ).map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded bg-amber-50 text-amber-600 font-bold text-[10px]">
                              PDF
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block truncate max-w-[180px]" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block">v{doc.version}.0 • {doc.fileSize}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-[#6C4CE1]/10 text-[#2D1B69] font-semibold">
                            {doc.voyageNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {doc.uploadedBy}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {doc.uploadedAt}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Downloading document: ${doc.fileName}`);
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded border border-slate-200 transition-colors cursor-pointer"
                              title="Download document file"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            {onDeleteDocument && (
                              <button
                                onClick={() => onDeleteDocument(doc.id)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded border border-slate-200 transition-colors cursor-pointer"
                                title="Delete document permanent"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>Showing <strong>{
                documents.filter(doc => 
                  doc.category === 'Financial Cost Document' || 
                  doc.type === 'Customs Document' ||
                  doc.fileName.toLowerCase().includes('invoice') || 
                  doc.fileName.toLowerCase().includes('receipt') || 
                  doc.fileName.toLowerCase().includes('bill') ||
                  doc.fileName.toLowerCase().includes('pda') ||
                  doc.fileName.toLowerCase().includes('fda')
                ).length
              }</strong> official financial records</span>
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Audit Sync Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Cost Line Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span>Record New Disbursement Cost Line</span>
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Associate with Voyage Reference *</label>
                <select
                  value={voyageId}
                  onChange={(e) => setVoyageId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Choose Voyage --</option>
                  {voyages.map(v => (
                    <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Expense Cost Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Pilotage">Pilotage (Inward/Outward)</option>
                  <option value="Tug Services">Tug Boat Assistances</option>
                  <option value="Mooring">Mooring & Unmooring Crews</option>
                  <option value="Bunkering">Bunkering (MGO Marine Fuel)</option>
                  <option value="Waste Disposal">Waste Disposal Barges</option>
                  <option value="Fresh Water">Fresh Water Supplies</option>
                  <option value="Crew Transport">Crew Taxi Transport</option>
                  <option value="Port Dues">Port Authority Dues</option>
                  <option value="Customs Clearances">Customs Clearance Fees</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">PDA Cost Estimate ($) *</label>
                  <input
                    type="number"
                    required
                    value={estAmount}
                    onChange={(e) => setEstAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Actual cost Statement ($) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none font-mono bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Expense Narrative Details</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Provide brief explanation for cost deviations or service specifics..."
                  className="w-full border border-slate-200 rounded-lg p-2 h-20 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
                  required
                />
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
                  className="px-5 py-2 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  {(userRole === 'SHIP_AGENT' || userRole === 'ADMIN') ? 'Submit FDA Audit' : 'Record PDA Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
