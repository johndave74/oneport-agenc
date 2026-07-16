import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckSquare } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Task } from '@/types';

interface TasksOverviewChartProps {
  tasks: Task[];
  setView: (view: string) => void;
}

const STATUS_ORDER: Task['status'][] = ['Pending', 'In Progress', 'Completed', 'Delayed'];
const STATUS_COLORS: Record<Task['status'], string> = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Completed: '#10b981',
  Delayed: '#e11d48',
};

export default function TasksOverviewChart({ tasks, setView }: TasksOverviewChartProps) {
  const counts: Record<Task['status'], number> = { Pending: 0, 'In Progress': 0, Completed: 0, Delayed: 0 };
  tasks.forEach(t => { counts[t.status]++; });
  const data = STATUS_ORDER.filter(status => counts[status] > 0).map(status => ({ name: status, value: counts[status] }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-4 w-4 text-[#6C4CE1]" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tasks Overview</h4>
        </div>
        <button onClick={() => setView('tasks')} className="text-xs font-semibold text-[#6C4CE1] hover:text-[#6C4CE1]/80 cursor-pointer">
          View all
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet." description="Tasks created for any voyage will appear here." size="sm" />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={2} dataKey="value">
                  {data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name as Task['status']]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-800">{tasks.length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">Total Tasks</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {STATUS_ORDER.map(status => (
              <div key={status} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  <span className="text-slate-600">{status}</span>
                </div>
                <span className="font-bold text-slate-800">{counts[status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
