import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  showBack?: boolean; // allow override
}

export function PageHeader({ title, description, icon, children, className, showBack }: PageHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // default to showing back button if not on root, unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : location.pathname !== '/';

  return (
    <div className={cn('px-6 py-4 flex items-center justify-between border-0 shadow-xs bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10 shrink-0', className)}>
      <div className="flex items-center gap-3">
        {shouldShowBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {icon && <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shadow-sm shrink-0">{icon}</span>}
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h1>
          {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
