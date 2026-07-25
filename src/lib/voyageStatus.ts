// Derives a port call's operational status from its completed milestones, so the
// status advances automatically (Scheduled → Arriving → Berthed → Cargo
// Operations → Departing → Completed) as agents tick events off — no manual
// status juggling, and the vessel/voyage stay in sync.

export type DerivedStatus = 'Scheduled' | 'Arriving' | 'Berthed' | 'Cargo Operations' | 'Departing' | 'Completed';

interface Milestone { event: string; completed: boolean }

export function deriveVoyageStatus(timeline: Milestone[]): DerivedStatus {
  if (!timeline || timeline.length === 0) return 'Scheduled';
  if (timeline.every((t) => t.completed)) return 'Completed';

  const done = timeline.filter((t) => t.completed).map((t) => t.event.toLowerCase());
  const any = (pred: (e: string) => boolean) => done.some(pred);

  if (any((e) => e.includes('sail') || e.includes('departed') || (e.includes('departure') && e.includes('complet')))) return 'Completed';
  if (any((e) => e.includes('cargo') && (e.includes('complet') || e.includes('finish')))) return 'Departing';
  if (any((e) => e.includes('cargo') && (e.includes('commenc') || e.includes('start') || e.includes('load') || e.includes('discharg')))) return 'Cargo Operations';
  if (any((e) => e.includes('berth') || e.includes('all fast') || e.includes('moor') || e.includes('first line'))) return 'Berthed';
  if (any((e) => e.includes('pilot') || e.includes('arriv') || e.includes('nor') || e.includes('anchor'))) return 'Arriving';
  return 'Scheduled';
}
