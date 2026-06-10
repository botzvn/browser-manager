import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Edit2, Layers, Plus, Trash2, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGroupStore } from './store';
import { PageLayout, PageToolbar, PageContent, PageCard } from '@/components/layout/PageLayout';
import type { GroupData } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';

const PRESET_COLORS = ['#64748b', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

export function GroupsPage() {
  const setPageTitle = useUIStore((s) => s.setPageTitle);
  const { t } = useTranslation("groups");
  const { groups, loadGroups, addGroup, editGroup, removeGroup, isLoading } = useGroupStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGroups();
    setPageTitle(t('title') as string);
    return () => setPageTitle('');
  }, [loadGroups, setPageTitle, t]);

  const handleOpenModal = (group?: GroupData) => {
    if (group) {
      setEditingGroup(group);
      setName(group.name);
      setDescription(group.description || '');
      setColor(group.color || PRESET_COLORS[0]);
    } else {
      setEditingGroup(null);
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingGroup) {
        await editGroup(editingGroup.id, { name, description, color });
      } else {
        await addGroup({ name, description, color });
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (group: GroupData) => {
    if (confirm(t('confirmDelete'))) {
      try {
        await removeGroup(group.id);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <PageLayout>
        <PageToolbar>
          <div className="text-sm font-medium text-slate-500">{t('subtitle', 'Organize your browser profiles into groups')}</div>
          <Button
            onClick={() => handleOpenModal()}
            className="shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 flex items-center gap-2 h-9 px-4 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('create', 'Create Group')}
          </Button>
        </PageToolbar>

        <PageContent>
          <PageCard>
            {isLoading && groups.length === 0 ? (
              /* Loading state */
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin mb-3" />
                <p className="text-sm">{t('checking') || 'Loading...'}</p>
              </div>
            ) : groups.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('noGroups')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-xs">{t('noGroupsHint', 'Create a group to organize your browser profiles and manage them together.')}</p>
                <Button variant="outline" onClick={() => handleOpenModal()} className="shadow-sm border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('create')}
                </Button>
              </div>
            ) : (
              /* Data table - card has p-0, table uses its own internal inset padding pl-6/pr-6 */
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50/70 border-b border-slate-200/60 dark:border-slate-700/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('name')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('description')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">{t('profileCount')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 border-b border-slate-100/80 dark:border-slate-700/30 transition-colors">
                      {/* Name column - uses inherited pl-6 from TableCell first:pl-6 */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-sm ring-[1.5px] ring-white dark:ring-slate-700 flex-shrink-0" style={{ backgroundColor: g.color || PRESET_COLORS[0] }} />
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{g.name}</span>
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {g.description || <span className="text-slate-300 dark:text-slate-600 italic text-xs">—</span>}
                      </TableCell>

                      {/* Profile count */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-slate-100/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/40"
                        >
                          <Users className="w-3 h-3" />
                          {g.profile_count ?? 0}
                        </Badge>
                      </TableCell>

                      {/* Actions - uses inherited pr-6 from TableCell last:pr-6 */}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(g)}
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(g)}
                            className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PageCard>
        </PageContent>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 border border-slate-200/80 dark:border-slate-700/50 shadow-lg bg-white/95 backdrop-blur-md dark:bg-slate-800/95 rounded-xl">
          <DialogHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">{editingGroup ? t('edit') : t('create')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('name')} <span className="text-destructive">*</span>
                </label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project A" className="border-slate-200 dark:border-slate-600 focus-visible:ring-primary/20" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('description')}
                  <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
                  className="border-slate-200 dark:border-slate-600 focus-visible:ring-primary/20"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('color')}</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={c}
                      className={`w-7 h-7 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : 'hover:scale-110 opacity-75 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: c,
                        ...(color === c ? ({ '--tw-ring-color': c } as React.CSSProperties) : {}),
                      }}
                    />
                  ))}
                </div>
                {/* Selected color preview */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-500 font-mono">{color}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={handleCloseModal}
                className="bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-0 shadow-sm transition-colors cursor-pointer"
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()} className="shadow-sm cursor-pointer">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('saving', 'Saving...')}
                  </span>
                ) : (
                  t('save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
