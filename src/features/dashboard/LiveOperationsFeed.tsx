import React from 'react';
import { Radio } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Voyage, AuditLog } from '@/types';

interface LiveOperationsFeedProps {
  voyages: Voyage[];
  auditLogs?: AuditLog[];
  limit?: number;
}

interface FeedEntry {
  id: string;
  type: 'timeline' | 'audit';
  timestamp: string;
  title: string;
  subtitle: string;
}

function buildLiveFeed(voyages: Voyage[], auditLogs: AuditLog[], limit: number): FeedEntry[] {
  const timelineEntries: FeedEntry[] = voyages.flatMap(v =>
    v.timeline
      .filter(t => t.completed && t.timestamp)
      .map((t, idx) => ({
        id: `${v.id}-tl-${idx}`,
        type: 'timeline' as const,
        timestamp: t.timestamp,
        title: t.event,
        subtitle: `${v.vesselName} · ${v.voyageNumber}`,
      }))
  );
  const auditEntries: FeedEntry[] = auditLogs.slice(0, 20).map(a => ({
    id: a.id,
    type: 'audit' as const,
    timestamp: a.timestamp,
    title: a.action,
    subtitle: `${a.userName} · ${a.details}`,
  }));

  return [...timelineEntries, ...auditEntries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export default function LiveOperationsFeed({ voyages, auditLogs = [], limit = 12 }: LiveOperationsFeedProps) {
  const entries = buildLiveFeed(voyages, auditLogs, limit);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center space-x-2 bg-slate-50">
        <Radio className="h-4 w-4 text-[#6C4CE1]" />
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Operations Feed</h4>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live operational events."
          description="Timeline milestones and audit activity will appear here as voyages progress."
          size="sm"
        />
      ) : (
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-3">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <span className={`h-2 w-2 rounded-full ${entry.type === 'timeline' ? 'bg-[#6C4CE1]' : 'bg-slate-300'}`} />
                  <span className="w-px flex-1 bg-slate-100 mt-1" />
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span>{entry.timestamp.replace('T', ' ').slice(0, 16)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{entry.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{entry.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
