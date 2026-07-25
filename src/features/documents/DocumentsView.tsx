import React, { useState, useRef, useEffect } from 'react';
import { FileText, Search, Upload, Download, Eye, Filter, FileSpreadsheet, Trash2, ShieldCheck, History, AlertTriangle } from 'lucide-react';
import { Document, Voyage } from '@/types';
import { Db } from '@/lib/db/db';
import Spinner from '@/components/ui/Spinner';

interface DocumentsViewProps {
  documents: Document[];
  voyages: Voyage[];
  orgId: string;
  onUploadDocument: (doc: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt' | 'version'>) => void;
  onDeleteDocument: (id: string) => void;
  userName: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt';

function isPdf(d: Document) { return (d.mimeType || '').includes('pdf') || d.fileName.toLowerCase().endsWith('.pdf'); }
function isImage(d: Document) { return (d.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(d.fileName); }

export default function DocumentsView({ documents, voyages, orgId, onUploadDocument, onDeleteDocument }: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [voyageFilter, setVoyageFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<Document['type']>('Bill of Lading');
  const [voyageId, setVoyageId] = useState('');
  const [fileCategory, setFileCategory] = useState('Cargo Documents');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Preview: fetch a signed URL when a document with a real file is opened.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  useEffect(() => {
    setPreviewUrl(null); setPreviewError(null);
    if (!selectedDoc?.storagePath) return;
    setPreviewLoading(true);
    Db.getDocumentUrl(selectedDoc.storagePath)
      .then(setPreviewUrl)
      .catch((e) => setPreviewError(e instanceof Error ? e.message : 'Could not load file'))
      .finally(() => setPreviewLoading(false));
  }, [selectedDoc]);

  const pickFile = (f: File) => {
    setFile(f);
    setUploadError(null);
    const n = f.name.toLowerCase();
    if (n.includes('crew')) { setDocType('Crew List'); setFileCategory('Operational Checklists'); }
    else if (n.includes('manifest')) { setDocType('Cargo Manifest'); setFileCategory('Cargo Documents'); }
    else if (n.includes('clearance')) { setDocType('Port Clearance'); setFileCategory('Port Authority Approvals'); }
    else if (n.includes('bill')) { setDocType('Bill of Lading'); setFileCategory('Cargo Documents'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !voyageId) return;
    setUploading(true); setUploadError(null);
    try {
      const storagePath = await Db.uploadDocumentFile(orgId, file);
      onUploadDocument({
        voyageId,
        voyageNumber: voyages.find((v) => v.id === voyageId)?.voyageNumber || 'TBA',
        fileName: file.name,
        fileSize: formatBytes(file.size),
        type: docType,
        category: fileCategory,
        storagePath,
        mimeType: file.type || undefined,
      });
      setFile(null); setVoyageId(''); setShowUploadModal(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Is the documents bucket created?');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.storagePath) { setSelectedDoc(doc); return; }
    try {
      const url = await Db.getDocumentDownloadUrl(doc.storagePath, doc.fileName);
      // Anchor click (not window.open) so pop-up blockers don't kill it.
      const a = window.document.createElement('a');
      a.href = url; a.download = doc.fileName; a.rel = 'noopener';
      window.document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      alert(`Couldn't download this file: ${err instanceof Error ? err.message : 'unknown error'}. If it just started, the storage bucket/migration may not be applied yet.`);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || doc.type.toLowerCase().includes(searchTerm.toLowerCase()) || doc.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    const matchesVoyage = voyageFilter === 'All' || doc.voyageId === voyageFilter;
    return matchesSearch && matchesType && matchesVoyage;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5"><Filter className="h-4 w-4 text-[#6C4CE1]" /> Document Filters</h4>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Port call</label>
            <select value={voyageFilter} onChange={(e) => setVoyageFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
              <option value="All">All port calls</option>
              {voyages.map((v) => <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
              {['All', 'Bill of Lading', 'Cargo Manifest', 'Customs Document', 'Crew List', 'Port Clearance', 'Invoice', 'Arrival Notice', 'Departure Report'].map((t) => <option key={t} value={t}>{t === 'All' ? 'All types' : t}</option>)}
            </select>
          </div>
          <button onClick={() => { setShowUploadModal(true); setUploadError(null); }} className="w-full bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/10 cursor-pointer">
            <Upload className="h-4 w-4" /> Upload Document
          </button>
        </div>
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl text-xs space-y-3 shadow-sm text-slate-700">
          <h5 className="font-bold text-[#6C4CE1] uppercase tracking-wider text-[10px] flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Storage</h5>
          <p className="text-slate-500 leading-relaxed text-[11px]">Files are stored privately and scoped to your organization. PDFs preview in-app; other files download. Supported: PDF, DOCX, XLSX, CSV, images.</p>
        </div>
      </div>

      {/* Table */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search documents…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white" />
          </div>
          <span className="text-xs text-slate-400">{filteredDocs.length} file{filteredDocs.length === 1 ? '' : 's'}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Document</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Port Call</th><th className="py-3 px-4">Version</th><th className="py-3 px-4">Uploaded</th><th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDocs.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No documents yet. Upload one to get started.</td></tr>
              ) : filteredDocs.map((doc) => {
                const sheet = /\.(xlsx|xls|csv)$/i.test(doc.fileName);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${sheet ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{sheet ? <FileSpreadsheet className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}</div>
                        <div>
                          <button className="font-bold text-slate-800 block hover:underline text-left cursor-pointer" onClick={() => setSelectedDoc(doc)}>{doc.fileName}</button>
                          <span className="text-[10px] text-slate-400">{doc.fileSize} · {doc.category}{!doc.storagePath && ' · (no file)'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">{doc.type}</td>
                    <td className="py-3.5 px-4"><span className="px-1.5 py-0.5 rounded text-[10px] bg-[#6C4CE1]/10 text-[#2D1B69] font-semibold border border-[#6C4CE1]/20">{doc.voyageNumber}</span></td>
                    <td className="py-3.5 px-4"><span className="flex items-center gap-1 text-[10px] text-slate-500"><History className="h-3.5 w-3.5 text-slate-300" /> v{doc.version}.0</span></td>
                    <td className="py-3.5 px-4 text-[10px] text-slate-500"><div>{doc.uploadedBy}</div><div className="text-[9px] text-slate-400">{(doc.uploadedAt || '').replace('T', ' ').slice(0, 16)}</div></td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedDoc(doc)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleDownload(doc)} disabled={!doc.storagePath} className="bg-[#6C4CE1]/10 hover:bg-[#6C4CE1] hover:text-white text-[#2D1B69] disabled:opacity-40 p-1.5 rounded-lg border border-[#6C4CE1]/20 transition-colors cursor-pointer" title="Download"><Download className="h-4 w-4" /></button>
                        <button onClick={() => onDeleteDocument(doc.id)} className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 truncate"><FileText className="h-4.5 w-4.5 text-[#6C4CE1] shrink-0" /> {selectedDoc.fileName}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedDoc.type} · {selectedDoc.voyageNumber}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedDoc.storagePath && <button onClick={() => handleDownload(selectedDoc)} className="px-3 py-1.5 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs cursor-pointer"><Download className="h-3.5 w-3.5" /> Download</button>}
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer leading-none">&times;</button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 overflow-auto">
              {!selectedDoc.storagePath ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2 p-6"><AlertTriangle className="h-8 w-8" /><p className="text-sm">No file attached (legacy record).</p></div>
              ) : previewLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2"><Spinner className="h-5 w-5 text-[#6C4CE1]" /> Loading file…</div>
              ) : previewError ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-rose-500 gap-2 p-6"><AlertTriangle className="h-8 w-8" /><p className="text-sm">{previewError}</p></div>
              ) : previewUrl && isPdf(selectedDoc) ? (
                <iframe src={previewUrl} title={selectedDoc.fileName} className="w-full h-full border-0" />
              ) : previewUrl && isImage(selectedDoc) ? (
                <div className="h-full flex items-center justify-center p-4"><img src={previewUrl} alt={selectedDoc.fileName} className="max-w-full max-h-full object-contain" /></div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3 p-6">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <p className="text-sm max-w-sm">This file type ({selectedDoc.fileName.split('.').pop()?.toUpperCase()}) can't preview in-browser. Download it to open in Word/Excel.</p>
                  <button onClick={() => handleDownload(selectedDoc)} className="px-4 py-2 bg-[#6C4CE1] hover:bg-[#5839C6] text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs cursor-pointer"><Download className="h-4 w-4" /> Download file</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Upload className="h-4.5 w-4.5 text-[#6C4CE1]" /> Upload Document</h4>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-[#6C4CE1] bg-[#6C4CE1]/5' : 'border-slate-200 hover:border-[#6C4CE1] bg-slate-50/50'}`}
              >
                <input type="file" ref={fileInputRef} accept={ACCEPT} onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} className="hidden" />
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <span className="font-semibold text-slate-700 block">{file ? `Selected: ${file.name}` : 'Drag & drop a file, or click to choose'}</span>
                <span className="text-[10px] text-slate-400 block mt-1">{file ? formatBytes(file.size) : 'PDF, DOCX, XLSX, CSV, images'}</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Port call *</label>
                <select value={voyageId} onChange={(e) => setVoyageId(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer" required>
                  <option value="">— Choose port call —</option>
                  {voyages.map((v) => <option key={v.id} value={v.id}>{v.vesselName} ({v.voyageNumber})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Type</label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value as Document['type'])} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    {['Bill of Lading', 'Cargo Manifest', 'Customs Document', 'Crew List', 'Port Clearance', 'Invoice'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold">Category</label>
                  <select value={fileCategory} onChange={(e) => setFileCategory(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white cursor-pointer">
                    {['Cargo Documents', 'Operational Checklists', 'Port Authority Approvals', 'Customs Clearances'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {uploadError && <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{uploadError}</span></div>}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={uploading || !file} className="px-5 py-2 bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 disabled:opacity-50 text-white rounded-lg font-semibold shadow-md flex items-center gap-2 cursor-pointer">
                  {uploading ? <><Spinner className="h-4 w-4" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
