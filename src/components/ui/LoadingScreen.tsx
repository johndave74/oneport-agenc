import React from 'react';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';

// Full-screen branded loader for auth / initial workspace load.
export default function LoadingScreen({ message = 'Loading your workspace…' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9] gap-5 font-sans">
      <div className="animate-pulse">
        <Logo />
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <Spinner className="h-4 w-4 text-[#6C4CE1]" />
        <span>{message}</span>
      </div>
    </div>
  );
}
