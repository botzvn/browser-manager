import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

import { useUIStore } from '@/store/useUIStore';

import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const navigate = useNavigate();
  const pageTitle = useUIStore((s) => s.pageTitle);
  const breadcrumbs = useUIStore((s) => s.breadcrumbs);

  return (
    <header
      className="h-16 bg-white/60 backdrop-blur-md dark:bg-slate-800/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between px-6 z-10 shrink-0 !w-full !pr-6 !mr-0"
    >
      <div className="flex items-center gap-4">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="flex items-center gap-1.5 hidden md:flex text-xs font-medium max-w-[200px] sm:max-w-[350px] md:max-w-[500px] lg:max-w-[700px] truncate min-w-0">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const content = crumb.label === 'Trang chủ' ? <Home className="w-3.5 h-3.5" /> : <span className="truncate max-w-[150px] sm:max-w-[300px] inline-block align-bottom">{crumb.label}</span>;

              return (
                <div key={index} className="flex items-center gap-1.5 min-w-0 shrink-0 first:shrink-0 last:shrink">
                  <div
                    className={
                      isLast
                        ? 'text-slate-800 dark:text-slate-100 font-bold flex items-center min-w-0 truncate'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center shrink-0'
                    }
                  >
                    {!isLast ? (
                      <div className="flex items-center h-full" onClick={() => (crumb.onClick ? crumb.onClick() : crumb.path && navigate(crumb.path))}>
                        {content}
                      </div>
                    ) : (
                      <div className="flex items-center h-full truncate min-w-0">{content}</div>
                    )}
                  </div>
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        ) : (
          pageTitle && <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 hidden md:block">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
