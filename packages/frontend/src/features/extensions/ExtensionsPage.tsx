import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ExternalLink, Globe, LayoutGrid, Puzzle, RefreshCw, Search, ShieldCheck, ToggleLeft, ToggleRight, Trash2, Upload, User, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout, PageToolbar, PageContent, PageCard } from '@/components/layout/PageLayout';
import type { ExtensionData, ExtensionType } from '@/lib/api';
import * as api from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';

import { UploadExtensionDialog } from './UploadExtensionDialog';

export function ExtensionsPage() {
  const { t } = useTranslation("extensions");

  const TYPE_FILTERS: { label: string; value: ExtensionType | 'ALL'; icon: React.ElementType }[] = useMemo(
    () => [
      { label: t('typeLabels.ALL'), value: 'ALL', icon: LayoutGrid },
      { label: t('typeLabels.PERSONAL'), value: 'PERSONAL', icon: User },
      { label: t('typeLabels.SYSTEM'), value: 'SYSTEM', icon: ShieldCheck },
      { label: t('typeLabels.TEAM'), value: 'TEAM', icon: Users },
    ],
    [t]
  );

  const setPageTitle = useUIStore((s) => s.setPageTitle);

  const [extensions, setExtensions] = useState<ExtensionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ExtensionType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadExtensions = useCallback(
    async (isInitial = false) => {
      if (isInitial || extensions.length === 0) setLoading(true);
      else setIsRefreshing(true);

      try {
        const data = await api.getExtensions(typeFilter, debouncedSearch || undefined);
        setExtensions(data);
      } catch (err) {
        console.error('Failed to load extensions:', err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [typeFilter, debouncedSearch, extensions.length]
  );

  useEffect(() => {
    loadExtensions();
    // Use an effect with a dependency on language if translation changes
    setPageTitle(t('title') as string);
    return () => setPageTitle('');
  }, [typeFilter, debouncedSearch, setPageTitle, t]); // Only trigger on these changes

  const confirmDelete = async (id: string) => {
    try {
      await api.deleteExtension(id);
      setExtensions((prev) => prev.filter((e) => e.id !== id));
      setPopoverOpenId(null);
    } catch (err) {
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await api.toggleExtension(id);
      setExtensions((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      alert(`Failed to toggle: ${(err as Error).message}`);
    }
  };

  const handleUploadComplete = (ext: ExtensionData) => {
    setExtensions((prev) => [ext, ...prev]);
    setShowUpload(false);
  };

  return (
    <PageLayout>
      {/* ─── Filter bar ─── */}
      <PageToolbar className="!flex-col !items-start">
        <div className="flex items-center justify-between py-1 w-full">
          <div className="text-sm font-medium text-slate-500">{t('installedCount', { count: extensions.length })}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadExtensions()}
              disabled={loading || isRefreshing}
              className="shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 text-slate-500 hover:text-primary cursor-pointer h-9 px-3 bg-white dark:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              onClick={() => setShowUpload(true)}
              className="shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 flex items-center gap-2 h-9 px-4 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {t('btnInstall')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 w-full">
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 w-full sm:w-auto overflow-x-auto">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                disabled={isRefreshing}
                onClick={() => setTypeFilter(f.value)}
                className={`cursor-pointer flex items-center px-3 py-1 h-7 text-xs font-medium rounded-lg transition-colors disabled:cursor-not-allowed ${
                  typeFilter === f.value
                    ? 'bg-[#f0f6ff] text-[#2b4c7e] dark:bg-primary/20 dark:text-primary hover:bg-[#f0f6ff] hover:text-[#2b4c7e]'
                    : 'text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <f.icon className={`w-3.5 h-3.5 mr-1.5 ${typeFilter === f.value ? 'text-[#2b4c7e] dark:text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            {isRefreshing ? (
              <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            )}
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-9 text-sm border-0 bg-white/80 dark:bg-slate-800/80 rounded-lg shadow-sm hover:shadow-md focus-visible:ring-0 focus-within:shadow-[0_4px_12px_rgba(var(--color-primary),0.08),inset_0_0_0_1px_var(--color-primary)] transition-all"
            />
          </div>
        </div>
      </PageToolbar>

      {/* ─── Table ─── */}
      <PageContent className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <PageCard>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <div className="w-7 h-7 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          ) : extensions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <Puzzle className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('noExtensionsTitle')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('noExtensionsDesc')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50/70 border-b border-slate-200/60 dark:border-slate-700/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5">{t('table.name')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5">{t('table.version')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5">{t('table.type')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5">{t('table.source')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5">{t('table.status')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extensions.map((ext) => (
                  <TableRow key={ext.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 border-b border-slate-100/80 dark:border-slate-700/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4 group/item">
                        {ext.icon_path ? (
                          <div className="relative">
                            <img
                              src={api.getExtensionIconUrl(ext.id)}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover shadow-[0_2px_10px_rgba(0,0,0,0.08)] bg-white shrink-0 border-0 p-1 group-hover/item:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/5 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm shrink-0 group-hover/item:scale-110 transition-transform duration-300">
                            <Puzzle className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate group-hover/item:text-primary transition-colors">{ext.name}</span>
                          {ext.description && !ext.description.includes('__MSG_') && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 truncate max-w-[250px]">{ext.description}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100/80 border border-slate-200/60 dark:border-slate-700 dark:bg-slate-700/50 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
                        v{ext.version || '1.0.0'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <TypeBadge type={ext.extension_type} t={t} />
                    </TableCell>

                    <TableCell>
                      {ext.source_type === 'CHROME_STORE' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = ext.store_url;
                            if (url) {
                              if ((window as any).runtime?.BrowserOpenURL) {
                                (window as any).runtime.BrowserOpenURL(url);
                              } else {
                                window.open(url, '_blank');
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-transparent border-0 cursor-pointer p-0"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Chrome Store
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">{t('sourceLocal')}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span
                        onClick={() => handleToggle(ext.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          ext.is_active ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {ext.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {ext.is_active ? t('status.active') : t('status.disabled')}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Popover open={popoverOpenId === ext.id} onOpenChange={(open) => setPopoverOpenId(open ? ext.id : null)}>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                            />
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-64 p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Confirm Deletion</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Delete proxy or extension? This cannot be undone.</span>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs cursor-pointer" onClick={() => setPopoverOpenId(null)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" size="sm" className="h-7 px-3 text-xs cursor-pointer shadow-sm" onClick={() => confirmDelete(ext.id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </PageCard>
      </PageContent>

      {showUpload && <UploadExtensionDialog onClose={() => setShowUpload(false)} onSuccess={handleUploadComplete} />}
    </PageLayout>
  );
}

function TypeBadge({ type, t }: { type: ExtensionType; t: any }) {
  const styles: Record<ExtensionType, string> = {
    PERSONAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SYSTEM: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    TEAM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[type]}`}>{t(`extensions.typeLabels.${type}`) || type}</span>;
}
