import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  size?: 'sm' | 'md';
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, size = 'md', className = '' }: EmptyStateProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const padding = size === 'sm' ? 'py-6' : 'py-10';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${padding} px-4 ${className}`}>
      <Icon className={`${iconSize} text-slate-300 mb-3`} />
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      {description && (
        <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2 px-4 rounded-lg border border-slate-200 transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
