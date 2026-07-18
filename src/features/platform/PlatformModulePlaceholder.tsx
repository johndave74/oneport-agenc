import React from 'react';
import { LucideIcon, Sparkles, CheckCircle2 } from 'lucide-react';

interface PlatformModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  note?: string;
}

// Honest, enterprise-styled page for platform modules that need an integration
// we haven't wired yet (billing, telemetry, security metrics). It shows what the
// module will contain rather than inventing live numbers.
export default function PlatformModulePlaceholder({ icon: Icon, title, description, bullets, note }: PlatformModulePlaceholderProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{description}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6C4CE1] bg-[#6C4CE1]/10 px-2.5 py-1 rounded-full shrink-0">
          <Sparkles className="h-3 w-3" /> Preview
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center border-b border-slate-100 bg-slate-50/40">
          <span className="h-14 w-14 rounded-2xl bg-[#6C4CE1]/10 text-[#6C4CE1] flex items-center justify-center mb-3">
            <Icon className="h-7 w-7" />
          </span>
          <h3 className="text-sm font-bold text-slate-800">Module ready to connect</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
            The structure is in place. Once its data source is connected, this page will show live information instead of a preview.
          </p>
        </div>
        <div className="p-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">What this will include</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            {bullets.map((b) => (
              <div key={b} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-300 mt-0.5 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
          {note && <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">{note}</p>}
        </div>
      </div>
    </div>
  );
}
