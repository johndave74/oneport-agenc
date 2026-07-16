import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Voyage, Vessel, Task, Document, Expense, User } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  voyages: Voyage[];
  vessels: Vessel[];
  tasks: Task[];
  documents: Document[];
  expenses: Expense[];
  users: User[];
  setView: (view: string) => void;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  view: string;
}

const NAV_COMMANDS: { label: string; view: string }[] = [
  { label: 'Go to Dashboard', view: 'dashboard' },
  { label: 'Go to Planning Centre', view: 'planning' },
  { label: 'Go to Port Calls', view: 'voyages' },
  { label: 'Go to Vessels', view: 'vessels' },
  { label: 'Go to Tasks', view: 'tasks' },
  { label: 'Go to Crew Management', view: 'crew' },
  { label: 'Go to Documents', view: 'documents' },
  { label: 'Go to Agents', view: 'crm' },
  { label: 'Go to Partners', view: 'partners' },
  { label: 'Go to Disbursements', view: 'expenses' },
  { label: 'Go to Invoices', view: 'invoices' },
  { label: 'Go to Tariffs', view: 'tariffs' },
  { label: 'Go to Approvals', view: 'approvals' },
  { label: 'Go to Laytime & Demurrage', view: 'laytime' },
  { label: 'Go to Reports & Analytics', view: 'reports' },
];

export default function CommandPalette({ isOpen, onOpen, onClose, voyages, vessels, tasks, documents, expenses, users, setView }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose(); else onOpen();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    voyages.forEach(v => {
      if (v.voyageNumber.toLowerCase().includes(q) || v.vesselName.toLowerCase().includes(q)) {
        out.push({ id: `voy-${v.id}`, type: 'Port Call', title: `${v.vesselName} — ${v.voyageNumber}`, subtitle: `${v.originPort} → ${v.destinationPort}`, view: 'voyages' });
      }
    });
    vessels.forEach(v => {
      if (v.vesselName.toLowerCase().includes(q) || v.imoNumber.toLowerCase().includes(q)) {
        out.push({ id: `ves-${v.id}`, type: 'Vessel', title: v.vesselName, subtitle: `IMO ${v.imoNumber} · ${v.vesselType}`, view: 'vessels' });
      }
    });
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(q)) {
        out.push({ id: `task-${t.id}`, type: 'Task', title: t.title, subtitle: `Voyage ${t.voyageNumber} · ${t.status}`, view: 'tasks' });
      }
    });
    documents.forEach(d => {
      if (d.fileName.toLowerCase().includes(q)) {
        out.push({ id: `doc-${d.id}`, type: 'Document', title: d.fileName, subtitle: `Voyage ${d.voyageNumber} · ${d.type}`, view: 'documents' });
      }
    });
    expenses.forEach(e => {
      if (e.category.toLowerCase().includes(q) || e.voyageNumber.toLowerCase().includes(q)) {
        out.push({ id: `exp-${e.id}`, type: 'Expense', title: `${e.category} — $${e.amount.toLocaleString()}`, subtitle: `Voyage ${e.voyageNumber} · ${e.status}`, view: 'expenses' });
      }
    });
    users.forEach(u => {
      if (u.name.toLowerCase().includes(q)) {
        out.push({ id: `user-${u.id}`, type: 'Partner', title: u.name, subtitle: u.role.replace('_', ' '), view: 'crm' });
      }
    });

    return out.slice(0, 20);
  }, [query, voyages, vessels, tasks, documents, expenses, users]);

  const filteredCommands = useMemo(
    () => NAV_COMMANDS.filter(c => c.label.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  if (!isOpen) return null;

  const goTo = (view: string) => {
    setView(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search port calls, vessels, tasks, documents, expenses, partners..."
            className="flex-1 ml-2.5 text-sm outline-none placeholder-slate-400"
          />
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">Esc</span>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div>
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Commands</span>
              {NAV_COMMANDS.map((cmd) => (
                <button
                  key={cmd.view}
                  onClick={() => goTo(cmd.view)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          ) : results.length === 0 && filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No matches for "{query}".</div>
          ) : (
            <>
              {filteredCommands.length > 0 && (
                <div className="mb-2">
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Commands</span>
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.view}
                      onClick={() => goTo(cmd.view)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              )}
              {results.length > 0 && (
                <div>
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Results</span>
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => goTo(r.view)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-slate-800 block truncate">{r.title}</span>
                        <span className="text-xs text-slate-400 block truncate">{r.subtitle}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#6C4CE1] bg-[#6C4CE1]/10 px-1.5 py-0.5 rounded shrink-0">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
