import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('h-full flex flex-col w-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/30', className)}>
      <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col space-y-4 max-w-full mt-2">{children}</div>
    </div>
  );
}

export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full shrink-0 flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-4 px-2 pb-2', className)}>{children}</div>;
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex-1 overflow-y-auto custom-scrollbar pt-2 px-1 pb-6', className)}>{children}</div>;
}

export function PageCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full bg-white/90 dark:bg-slate-800/90 rounded-xl  transition-shadow border-0 overflow-hidden flex flex-col', className)}>{children}</div>;
}
