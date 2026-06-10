import { useEffect, useRef, useState } from 'react';
import { type ChangeEvent, type ElementType } from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { Download, Edit3, Filter, Loader2, Play, RefreshCw, Search, Square, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useShallow } from 'zustand/react/shallow';
import { PageCard, PageContent, PageLayout, PageToolbar } from '@/components/layout/PageLayout';
import { useUIStore } from '@/store/useUIStore';

import { useAppStore } from '../store';
import { ProfileList } from '../components/ProfileList';

export function ProfilesPage() {
  const { t } = useTranslation("profiles");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const navigate = useNavigate();
  const setPageTitle = useUIStore((s) => s.setPageTitle);
  const { profiles, selectedProfiles, isLoading, searchQuery, setSearchQuery, loadProfiles, createProfile, startProfile, stopProfile, deleteProfiles } = useAppStore(
    useShallow((s) => ({
      profiles: s.profiles,
      selectedProfiles: s.selectedProfiles,
      isLoading: s.isLoading,
      searchQuery: s.searchQuery,
      setSearchQuery: s.setSearchQuery,
      loadProfiles: s.loadProfiles,
      createProfile: s.createProfile,
      startProfile: s.startProfile,
      stopProfile: s.stopProfile,
      deleteProfiles: s.deleteProfiles,
    }))
  );

  useEffect(() => {
    setPageTitle(t('sidebar.items.Profiles', 'Profiles'));
    return () => setPageTitle('');
  }, [setPageTitle, t]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleCreate = () => {
    navigate('/profile/create');
  };

  const handleBulkStart = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(selectedProfiles.map((id) => startProfile(id)));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStop = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(selectedProfiles.map((id) => stopProfile(id)));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkExport = () => {
    const selected = profiles.filter((p) => selectedProfiles.includes(p.id));
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiles_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBulkLoading(true);
    try {
      const items = JSON.parse(await file.text());
      if (!Array.isArray(items)) throw new Error(t('list.jsonArrayError', 'JSON must be an array'));
      for (const item of items) {
        await createProfile({
          name: item.name || t('list.importedProfileDefault', 'Imported Profile'),
          platform_url: item.platform_url || item.url || 'https://bot.sannysoft.com/',
          fingerprint: item.fingerprint || { screen: item.screen || { width: 1365, height: 768 } },
          startup_args: item.startup_args || item.launchArgs || [],
        });
      }
      await loadProfiles();
    } catch (err: any) {
      alert(t('list.importFailed', 'Import failed: ') + (err.message || err));
    } finally {
      setBulkLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <PageLayout>
      <PageToolbar className="hidden sm:flex">
        <div className="flex items-center">
          <div className="h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{t('list.all', 'All')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={t('list.searchPlaceholder', 'Search profiles...')}
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                window.setTimeout(() => loadProfiles(), 0);
              }}
              className="pl-9 w-64 h-9 border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <Button variant="outline" size="icon" className="shadow-sm border-0 h-9 w-9 bg-white dark:bg-slate-800 text-slate-500">
            <Filter className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="shadow-sm border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary bg-white dark:bg-slate-800 h-9 w-9 cursor-pointer"
            onClick={() => loadProfiles()}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="outline"
            size="sm"
            disabled={bulkLoading}
            onClick={() => fileInputRef.current?.click()}
            className="shadow-sm border-0 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 font-medium h-9 px-3"
          >
            <Download className="w-4 h-4 mr-1.5 text-primary" />
            {t('list.bulkImport', 'Bulk import')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

          <Button
            variant="outline"
            size="sm"
            className="shadow-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border-slate-200 dark:border-slate-700 px-3 h-9"
            onClick={() => selectedProfiles.length && deleteProfiles(selectedProfiles)}
            disabled={!selectedProfiles.length}
          >
            <Trash2 className="w-4 h-4 mr-1.5 text-red-500" />
            {t('list.delete', 'Delete')}
          </Button>

          <Button size="sm" className="shadow-sm bg-primary hover:bg-primary/90 text-white font-medium border-0 px-4 h-9 cursor-pointer" onClick={handleCreate}>
            {t('list.newProfile', 'New profile')}
          </Button>
        </div>
      </PageToolbar>

      <PageContent>
        <PageCard className="h-full">
          {selectedProfiles.length > 0 && (
            <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 p-2.5 px-6 flex items-center justify-between text-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg shadow-sm border border-primary/20">
                  {selectedProfiles.length} <span className="text-slate-500 font-normal ml-1">{t('list.selected', 'selected')}</span>
                </span>
                <div className="h-4 w-px bg-primary/20 dark:bg-slate-600 mx-2" />
                <BulkActionButton icon={Play} label={t('list.start', 'Start')} onClick={handleBulkStart} disabled={bulkLoading} />
                <BulkActionButton icon={Square} label={t('list.stop', 'Stop')} onClick={handleBulkStop} disabled={bulkLoading} />
                <BulkActionButton icon={Download} label={t('list.export', 'Export')} onClick={handleBulkExport} />
                <BulkActionButton icon={Edit3} label={t('list.modify', 'Modify')} disabled />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                onClick={() => {
                  if (confirm(t('list.confirmDeleteSelected', 'Delete selected profiles?'))) deleteProfiles(selectedProfiles);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <ProfileList />
        </PageCard>
      </PageContent>
    </PageLayout>
  );
}

function BulkActionButton({ icon: Icon, label, onClick, disabled }: { icon: ElementType; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 px-2.5 flex items-center gap-1.5 text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer rounded-lg"
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Button>
  );
}
