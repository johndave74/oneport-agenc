import React from 'react';
import { Compass } from 'lucide-react';

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export default function Logo({ className = '', dark = false }: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-10 h-10 bg-[#6C4CE1] rounded-lg flex items-center justify-center shadow-md shadow-[#6C4CE1]/20">
        <Compass className="h-6 w-6 text-white" />
      </div>
      <div className="flex flex-col">
        <span className={`font-serif font-bold text-lg tracking-tight leading-none ${dark ? 'text-white' : 'text-[#1e293b]'}`}>
          ONEPORT
        </span>
        <span className={`text-[10px] font-bold tracking-widest leading-tight ${dark ? 'text-slate-400' : 'text-[#1e293b]'}`}>
          AGENC
        </span>
      </div>
    </div>
  );
}
