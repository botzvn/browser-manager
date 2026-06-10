import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ChevronLeft, FileText, Network, PanelsTopLeft, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  badge?: string;
  active?: boolean;
}

import { registry } from '../../lib/registry';

const coreMenuItems = [
  { icon: FileText, label: 'Profiles', path: '/' },
  { icon: Network, label: 'Proxy', path: '/proxy' },
  { icon: Users, label: 'Groups', path: '/groups' },
];

function getCombinedMenuItems() {
  return [...coreMenuItems, ...registry.getMenuItems()];
}

export function Sidebar() {
  const isSidebarExpanded = useUIStore((s) => s.isSidebarExpanded);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'h-full bg-white/80 backdrop-blur-md dark:bg-slate-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col relative z-20',
        isSidebarExpanded ? 'w-54' : 'w-18'
      )}
    >
      <div className="h-16 flex items-center justify-center px-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] z-10">
        <div className={cn('flex min-w-0 items-center gap-2.5 transition-all duration-300', !isSidebarExpanded && 'w-full justify-center')}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(28,146,210,0.16)] dark:bg-primary/15 dark:shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <PanelsTopLeft className="h-5 w-5 stroke-[2.2]" />
          </div>
          {isSidebarExpanded && (
            <div className="flex min-w-0 flex-col justify-center">
              <span className="text-[19px] font-extrabold leading-none text-slate-900 dark:text-slate-50">
                BOT<span className="text-primary">zVN</span>
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase leading-none text-slate-500 dark:text-slate-400">
                <span className="h-px w-4 rounded-full bg-primary/50" />
                Browser Manager
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgb(0,0,0,0.08)] border-0 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:shadow-[0_4px_12px_rgb(0,0,0,0.12)] hover:scale-110 z-30 text-primary"
      >
        <ChevronLeft className={cn('w-3.5 h-3.5 transition-transform duration-300', !isSidebarExpanded && 'rotate-180')} />
      </button>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        <MenuSection items={getCombinedMenuItems()} isExpanded={isSidebarExpanded} currentPath={location.pathname} />
      </nav>
    </aside>
  );
}

function MenuSection({ title, items, isExpanded, currentPath }: { title?: string; items: MenuItem[]; isExpanded: boolean; currentPath?: string }) {
  const { t } = useTranslation("sidebar");

  const isActive = (itemPath?: string) => {
    if (!itemPath || !currentPath) return false;
    if (itemPath === '/') return currentPath === '/' || currentPath === '/profile/create' || currentPath.startsWith('/profile/edit/');
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  return (
    <div>
      {title && isExpanded && <h4 className="text-xs font-semibold text-slate-400 mb-2 px-2 uppercase tracking-wider">{t(`sidebar.sections.${title.toLowerCase()}`, title)}</h4>}
      <ul className="space-y-1">
        {items.map((item, idx) => {
          const active = isActive(item.path) || item.active;
          return (
            <li key={idx}>
              <Link
                to={item.path || '#'}
                onClick={(e) => {
                  if (!item.path) e.preventDefault();
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer group',
                  active
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/80'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary dark:hover:text-primary/80',
                  !isExpanded && 'justify-center px-0'
                )}
                title={!isExpanded && typeof t(`sidebar.items.${item.label}`, item.label) === 'string' ? (t(`sidebar.items.${item.label}`, item.label) as string) : undefined}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110', active && 'text-primary dark:text-primary/80')} />
                {isExpanded && (
                  <div className="flex flex-1 items-center justify-between">
                    <span>{typeof t(`sidebar.items.${item.label}`, item.label) === 'string' ? t(`sidebar.items.${item.label}`, item.label) : item.label}</span>
                    {item.badge && <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-sm">{item.badge}</span>}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
