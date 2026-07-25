import React from 'react';
import { Loader2 } from 'lucide-react';

// Consistent loading spinner. Pass Tailwind size/colour via className.
export default function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />;
}
