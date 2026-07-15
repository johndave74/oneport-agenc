import React from 'react';
import { Sliders } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Task, TaskCategory } from '@/types';

interface OperationsChecklistProps {
  tasks: Task[];
  setView: (view: string) => void;
}

const CATEGORY_ORDER: (TaskCategory | 'Uncategorized')[] = ['Documentation', 'Commercial', 'Marine', 'Crew', 'Authorities', 'Uncategorized'];

function groupTasks(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {};
  for (const t of tasks) {
    const key = t.category ?? 'Uncategorized';
    (groups[key] ??= []).push(t);
  }
  return groups;
}

const STATUS_STYLES: Record<Task['status'], string> = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Delayed: 'bg-rose-50 text-rose-700 border-rose-100',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
  Pending: 'bg-slate-50 text-slate-650 border-slate-100',
};

export default function OperationsChecklist({ tasks, setView }: OperationsChecklistProps) {
  const groups = groupTasks(tasks);
  const orderedKeys = CATEGORY_ORDER.filter(k => groups[k]?.length);

  return (
    <div className="bg-white border border-slate-200 text-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 text-[#6C4CE1]">
        <Sliders className="h-4 w-4" />
        <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Operations Checklist</h4>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Sliders}
          title="No active operations checklist items."
          description="Create a vessel and a voyage to generate action items."
          action={{ label: 'Open Tasks', onClick: () => setView('tasks') }}
          size="sm"
        />
      ) : (
        <div className="space-y-4 text-xs text-slate-600">
          {orderedKeys.map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{key}</span>
                <span className="text-[10px] font-mono text-slate-400">{groups[key].length}</span>
              </div>
              <div className="space-y-2">
                {groups[key].slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <span className="truncate max-w-[180px]" title={task.title}>{task.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${STATUS_STYLES[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="border-slate-100" />
      <div className="text-slate-500 text-[11px] leading-relaxed">
        Check details or add new items under the{' '}
        <span className="text-[#6C4CE1] font-bold cursor-pointer hover:underline" onClick={() => setView('tasks')}>Tasks Panel</span>.
      </div>
    </div>
  );
}
