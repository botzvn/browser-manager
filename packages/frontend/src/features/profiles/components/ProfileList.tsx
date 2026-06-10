import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { ColumnDef, RowSelectionState, Table } from '@tanstack/react-table';
import { useShallow } from 'zustand/react/shallow';
import { Apple, Chrome, Copy, Eye, Loader2, Monitor, MoreVertical, Play, Settings, Square, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppStore } from '../../profiles/store';
import type { ProfileData } from '../../profiles/types';
import { ProfileViewerDialog } from './ProfileViewerDialog';

export function ProfileList() {
  const { t } = useTranslation("profiles");
  const navigate = useNavigate();
  const { profiles, filterConfig, isLoading, loadProfiles, hydratePage, startProfile, stopProfile, deleteProfiles, selectAllProfiles, selectedProfiles, duplicateProfile } = useAppStore(
    useShallow((s) => ({
      profiles: s.profiles,
      filterConfig: s.filterConfig,
      isLoading: s.isLoading,
      loadProfiles: s.loadProfiles,
      hydratePage: s.hydratePage,
      startProfile: s.startProfile,
      stopProfile: s.stopProfile,
      deleteProfiles: s.deleteProfiles,
      selectAllProfiles: s.selectAllProfiles,
      selectedProfiles: s.selectedProfiles,
      duplicateProfile: s.duplicateProfile,
    }))
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(() => {
    const initial: RowSelectionState = {};
    selectedProfiles.forEach((id) => {
      initial[id] = true;
    });
    return initial;
  });

  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [viewerProfile, setViewerProfile] = React.useState<ProfileData | null>(null);

  // Sync selection to global store
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    selectAllProfiles(selectedIds);
  }, [rowSelection, selectAllProfiles]);

  // Auto-reset confirm delete after 3s
  React.useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => setConfirmDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  // Initial fetch
  React.useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Hydrate status for the current visible page only
  const handlePageChange = React.useCallback(
    (visibleRows: ProfileData[]) => {
      const ids = visibleRows.map((p) => p.id);
      hydratePage(ids);
    },
    [hydratePage]
  );

  const handleStart = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await startProfile(id);
    } catch (err) {
      console.error('Start failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await stopProfile(id);
    } catch (err) {
      console.error('Stop failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await duplicateProfile(id);
    } catch (err) {
      console.error('Duplicate failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<ProfileData>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="translate-y-[2px] border-0 shadow-sm data-[state=checked]:bg-primary bg-white dark:bg-slate-800"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="translate-y-[2px] border-0 shadow-sm data-[state=checked]:bg-primary bg-white dark:bg-slate-800"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'index',
      header: () => t('list.no'),
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        return <span className="text-slate-500 font-medium pl-2">{pageIndex * pageSize + row.index + 1}</span>;
      },
    },
    {
      id: 'status',
      header: () => '',
      cell: ({ row }) => {
        const profile = row.original;
        const isRunning = profile.status === 'running';
        const isThisLoading = actionLoading === profile.id;

        return (
          <div className="flex items-center justify-center">
            {isThisLoading ? (
              <Button variant="outline" size="sm" disabled className="h-[30px] px-4 rounded-full border-slate-200 bg-white shadow-sm w-[86px]">
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-400" />
                <span className="text-slate-400 text-xs">...</span>
              </Button>
            ) : isRunning ? (
              <div className="flex bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 rounded-full h-[30px] overflow-hidden items-center shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-full px-3.5 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-r-none border-r border-rose-200/50 dark:border-rose-500/20 transition-none"
                  onClick={(e) => handleStop(e, profile.id)}
                >
                  <Square className="w-3 h-3 mr-1.5 fill-current stroke-current" />
                  <span className="text-xs font-semibold">{t('list.stop')}</span>
                </Button>
                {profile.wsEndpoint && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-full w-[30px] shrink-0 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-l-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(profile.wsEndpoint || '');
                    }}
                    title={t('list.copyCdp', 'Copy CDP')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-[30px] shrink-0 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerProfile(profile);
                  }}
                  title={t('list.openNovnc', 'Open noVNC view')}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-[30px] px-4 rounded-full bg-slate-100/80 text-slate-700 hover:bg-primary hover:text-primary-foreground dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary border border-transparent shadow-sm hover:shadow-md transition-none"
                onClick={(e) => handleStart(e, profile.id)}
              >
                <Play className="w-3 h-3 mr-1.5 fill-current" />
                <span className="text-xs font-semibold">{t('list.start')}</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center h-[30px] w-[30px] rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors ml-1">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={() => navigate('/profile/edit/' + profile.id)}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('list.edit', 'Edit Profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleDuplicate(e, profile.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  {t('list.duplicate', 'Duplicate Profile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(t('list.confirmMoveToTrash', 'Move profile "{{name}}" to trash?', { name: profile.name }))) {
                      deleteProfiles([profile.id])
                        .then(() => {
                          setRowSelection((prev) => {
                            const next = { ...prev };
                            delete next[profile.id];
                            return next;
                          });
                        })
                        .catch(console.error);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('list.delete', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      id: 'name',
      header: () => t('list.profiles'),
      cell: ({ row }) => {
        const profile = row.original;

        return (
          <div className="flex items-center gap-4 py-1.5">
            {/* OS icon */}
            <div className="relative w-[34px] h-[34px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0">
              {profile.os === 'mac' ? <Apple className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-[2px] shadow-sm border border-slate-100 dark:border-slate-800">
                <Chrome className="w-[10px] h-[10px] text-blue-500" />
              </div>
            </div>

            {/* Name + group */}
            <div className="flex flex-col justify-center gap-0.5 w-[250px] shrink-0">
              <span
                className="font-semibold text-[14px] leading-tight text-slate-800 dark:text-slate-200 hover:text-primary transition-colors cursor-pointer truncate"
                onClick={() => navigate('/profile/edit/' + profile.id)}
                title={profile.name}
              >
                {profile.name}
              </span>
              {profile.group_name ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: profile.group_color || '#64748b' }} />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{profile.group_name}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">--</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'proxy',
      header: () => t('list.proxy'),
      cell: ({ row }) => {
        const p = row.original;
        if (!p.proxy_host || !p.proxy_port) return <div className="text-slate-500">{t('list.notConfigured', 'Not configured')}</div>;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {p.proxy_host}:{p.proxy_port}
            </span>
            {p.proxy_type && <span className="text-xs text-slate-400 mt-0.5 uppercase">{p.proxy_type}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: () => t('list.notes'),
      cell: ({ row }) => <div className="text-slate-500 max-w-[150px] truncate">{row.getValue('notes') || '--'}</div>,
    },
    {
      accessorKey: 'tags',
      header: () => t('list.tags'),
      cell: ({ row }) => <div className="text-slate-500">{row.getValue('tags') || '--'}</div>,
    },
  ];

  // Apply client-side filters
  const filteredProfiles = React.useMemo(() => {
    return profiles.filter((p) => {
      // Status filter
      if (filterConfig.status && filterConfig.status !== 'all') {
        if (p.status !== filterConfig.status) return false;
      }

      // OS filter
      if (filterConfig.os && filterConfig.os !== 'all') {
        if (p.os !== filterConfig.os) return false;
      }

      // Proxy type filter
      if (filterConfig.proxy_type && filterConfig.proxy_type !== 'all') {
        if (filterConfig.proxy_type === 'none') {
          if (p.proxy_type || p.proxy_host) return false;
        } else if (filterConfig.proxy_type === 'http') {
          if (p.proxy_type !== 'http' && p.proxy_type !== 'https') return false;
        } else if (filterConfig.proxy_type === 'socks5') {
          if (p.proxy_type !== 'socks5') return false;
        }
      }

      // Tag filter
      if (filterConfig.tag && filterConfig.tag.trim() !== '') {
        const queryTag = filterConfig.tag.trim().toLowerCase();
        const pTags = (p.tags || '').toLowerCase();
        if (!pTags.includes(queryTag)) return false;
      }

      return true;
    });
  }, [profiles, filterConfig]);

  // Footer left: bulk delete
  const footerLeft = (table: Table<ProfileData>) => {
    const selectedCount = Object.keys(table.getState().rowSelection ?? {}).filter((k) => (table.getState().rowSelection ?? {})[k]).length;

    if (selectedCount === 0) {
      return (
        <span className="text-xs text-slate-400">
          Showing {filteredProfiles.length} of {profiles.length} profiles
        </span>
      );
    }

    return confirmDelete ? (
      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-lg border-0 text-white bg-red-500 hover:bg-red-600 px-3 text-xs font-semibold"
        onClick={async () => {
          const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
          setConfirmDelete(false);
          try {
            await deleteProfiles(ids);
            setRowSelection({});
          } catch (err) {
            console.error('Delete failed:', err);
          }
        }}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        {t('list.delete')} {selectedCount}?
      </Button>
    ) : (
      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-lg border-0 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white px-3 text-xs font-semibold transition-all"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        {t('list.delete')} ({selectedCount})
      </Button>
    );
  };

  return (
    <>
      <DataTable<ProfileData>
        data={filteredProfiles}
        columns={columns}
        getRowId={(row) => row.id}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isLoading && profiles.length === 0}
        emptyContent={t('list.noProfiles')}
        footerLeft={footerLeft}
        onPageChange={handlePageChange}
      />
      <ProfileViewerDialog profile={viewerProfile} onClose={() => setViewerProfile(null)} />
    </>
  );
}
