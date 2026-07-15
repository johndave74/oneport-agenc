import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Plus, 
  Filter, 
  FileCode, 
  FileSpreadsheet, 
  Trash2, 
  ShieldCheck, 
  Clock,
  History
} from 'lucide-react';
import { Document, Voyage, UserRole } from '@/types';

interface DocumentsViewProps {
  documents: Document[];
  voyages: Voyage[];
  onUploadDocument: (doc: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt' | 'version'>) => void;
  onDeleteDocument: (id: string) => void;
  userName: string;
}

export default function DocumentsView({ 
  documents, 
  voyages, 
  onUploadDocument, 
  onDeleteDocument,
  userName
}: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [voyageFilter, setVoyageFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Form State
  const [fileName, setFileName] = useState('');
  const [docType, setDocType] = useState<Document['type']>('Bill of Lading');
  const [voyageId, setVoyageId] = useState('');
  const [fileCategory, setFileCategory] = useState('Cargo Documents');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers
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
      setFileName(file.name);
      // Auto-categorize based on suffix/name
      if (file.name.toLowerCase().includes('crew')) {
        setDocType('Crew List');
        setFileCategory('Operational Checklists');
      } else if (file.name.toLowerCase().includes('manifest')) {
        setDocType('Cargo Manifest');
        setFileCategory('Cargo Documents');
      } else if (file.name.toLowerCase().includes('clearance')) {
        setDocType('Port Clearance');
        setFileCategory('Port Authority Approvals');
      } else if (file.name.toLowerCase().includes('bill')) {
        setDocType('Bill of Lading');
        setFileCategory('Cargo Documents');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !voyageId) return;

    onUploadDocument({
      voyageId,
      voyageNumber: voyages.find(v => v.id === voyageId)?.voyageNumber || 'TBA',
      fileName,
      fileSize: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      type: docType,
      category: fileCategory
    });

    setFileName('');
    setVoyageId('');
    setShowUploadModal(false);
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    const matchesVoyage = voyageFilter === 'All' || doc.voyageId === voyageFilter;

    return matchesSearch && matchesType && matchesVoyage;
  });

  // Simulated Download
  const handleDownload = (doc: Document) => {
    // Generate a simple text file download with metadata to represent a mock clearance document
    const element = window.document.createElement("a");
    const file = new Blob([
      `MARITIME SECURITY CLEARANCE EXPORT\n`,
      `-----------------------------------\n`,
      `File Name: ${doc.fileName}\n`,
      `Document Type: ${doc.type}\n`,
      `Voyage ID: ${doc.voyageNumber}\n`,
      `Version Tracker: v${doc.version}\n`,
      `Audited Verification Status: SECURE\n`,
      `Cleared at UK Port Authority by Apex Ocean Systems on ${doc.uploadedAt}\n`,
      `Uploaded By: ${doc.uploadedBy}\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.fileName}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Col 1: Filters Sidebar */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <Filter className="h-4 w-4 text-[#6C4CE1]" />
            <span>Clearance Directories</span>
          </h4>
          
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Voyage filter</label>
            <select
              value={voyageFilter}
              onChange={(e) => setVoyageFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="All">All Active Voyages</option>
              {voyages.map(v => (
                <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Document Class</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
            >
              <option value="All">All Classifications</option>
              <option value="Bill of Lading">Bill of Lading</option>
              <option value="Cargo Manifest">Cargo Manifest</option>
              <option value="Customs Document">Customs Document</option>
              <option value="Crew List">Crew List</option>
              <option value="Port Clearance">Port Clearance</option>
              <option value="Invoice">Invoice</option>
              <option value="Arrival Notice">Arrival Notice</option>
              <option value="Departure Report">Departure Report</option>
            </select>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Clearance Doc</span>
          </button>
        </div>

        {/* Directory Guidelines Card */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl text-xs space-y-3.5 shadow-sm text-slate-700">
          <h5 className="font-bold text-[#6C4CE1] uppercase tracking-wider text-[10px] font-mono flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-[#6C4CE1]" />
            <span>Customs & Security Rules</span>
          </h5>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            In accordance with ISPS maritime regulations, all arrival declarations, cargo manifests, and crew declarations must be cleared 24 hours prior to berthing.
          </p>
          <hr className="border-slate-100" />
          <div className="text-[10px] text-slate-500 font-mono space-y-1">
            <div>• Manifests: Required (Port Agent)</div>
            <div>• Crew List: Required (Ship Agent)</div>
            <div>• Port Clearance: Required (Southampton Port)</div>
          </div>
        </div>
      </div>

      {/* Col 2,3,4: Document Manager Grid/Table */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Document Search Header */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clearance docs by name or voyage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {filteredDocs.length} files</span>
        </div>

        {/* Document Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Document Details</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Voyage</th>
                <th className="py-3 px-4">Version control</th>
                <th className="py-3 px-4">Authorized Clearance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No clearance documents found for the active filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isSpreadsheet = doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.csv');
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSpreadsheet ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {isSpreadsheet ? <FileSpreadsheet className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block hover:underline cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                              {doc.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{doc.fileSize} • {doc.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {doc.type}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[#6C4CE1]/10 text-[#2D1B69] font-semibold border border-[#6C4CE1]/20">
                          {doc.voyageNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-500">
                          <History className="h-3.5 w-3.5 text-slate-300" />
                          <span>v{doc.version}.0 (Active)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                        <div>Upload: {doc.uploadedBy}</div>
                        <div className="text-[9px] text-slate-400">{doc.uploadedAt.replace('T', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 transition-colors"
                            title="Preview file"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="bg-[#6C4CE1]/10 hover:bg-[#6C4CE1] hover:text-white text-[#2D1B69] p-1.5 rounded-lg border border-[#6C4CE1]/20 hover:border-[#6C4CE1] transition-colors cursor-pointer"
                            title="Download verified copy"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
                            title="Delete Document Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Document View Preview Drawer Overlay */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <FileText className="h-4.5 w-4.5 text-[#6C4CE1]" />
                  <span>Clearing File Preview</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedDoc.fileName}</p>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 font-mono text-xs space-y-4 border-b border-slate-100 leading-relaxed text-slate-700">
              <div className="border border-slate-200/80 rounded bg-white p-4 space-y-2.5 shadow-inner">
                <p className="font-bold border-b pb-1 text-slate-900 uppercase">OFFICIAL PORT DISPATCH CLEARANCE</p>
                <p>FILE_NAME: <span className="font-semibold text-slate-800">{selectedDoc.fileName}</span></p>
                <p>DOCUMENT_CLASS: <span className="font-semibold text-slate-800">{selectedDoc.type}</span></p>
                <p>MANIFEST_CATEGORY: <span className="font-semibold text-slate-800">{selectedDoc.category}</span></p>
                <p>VOYAGE_REFERENCE: <span className="font-bold text-[#6C4CE1]">{selectedDoc.voyageNumber}</span></p>
                <p>SECURITY_VERSION_ID: <span className="font-semibold">v{selectedDoc.version}.0-RELEASE</span></p>
                <p>SIGNATURE_SYSTEM: Apex Port Operations Portal</p>
                <p>CLEARANCE_DATE: {selectedDoc.uploadedAt.replace('T', ' ')}</p>
                <p>VERIFICATION: <span className="text-emerald-600 font-bold">✓ VERIFIED BY UK BORDER FORCE</span></p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Dismiss Preview
              </button>
              <button
                onClick={() => {
                  handleDownload(selectedDoc);
                  setSelectedDoc(null);
                }}
                className="px-4 py-2 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition-colors shadow-md shadow-slate-900/10 cursor-pointer text-xs"
              >
                <Download className="h-4 w-4" />
                <span>Download verified file</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Upload className="h-4.5 w-4.5 text-[#6C4CE1]" />
                <span>Upload Port Clearance Document</span>
              </h4>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Drag and drop zone */}
              <div 
                ref={dragRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-[#6C4CE1] bg-[#6C4CE1]/10/50' 
                    : 'border-slate-200 hover:border-[#6C4CE1] bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden" 
                />
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <span className="font-semibold text-slate-700 block">
                  {fileName ? `Selected: ${fileName}` : 'Drag & drop cargo manifest or click to choose'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">Supports PDF, XLSX, CSV up to 10MB</span>
              </div>

              {fileName && (
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Verify Document Name</label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] font-mono bg-white text-xs"
                  />
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Document Type Class</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as Document['type'])}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Bill of Lading">Bill of Lading</option>
                    <option value="Cargo Manifest">Cargo Manifest</option>
                    <option value="Customs Document">Customs Document</option>
                    <option value="Crew List">Crew List</option>
                    <option value="Port Clearance">Port Clearance</option>
                    <option value="Invoice">Invoice</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Storage Category</label>
                  <select
                    value={fileCategory}
                    onChange={(e) => setFileCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Cargo Documents">Cargo Documents</option>
                    <option value="Operational Checklists">Operational Checklists</option>
                    <option value="Port Authority Approvals">Port Authority Approvals</option>
                    <option value="Customs Clearances">Customs Clearances</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white rounded-lg font-semibold shadow-md shadow-slate-900/10 cursor-pointer text-xs"
                >
                  File & Version Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
