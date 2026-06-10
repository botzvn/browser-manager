import { useCallback, useEffect, useState } from 'react';

import { Check, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ExtensionData } from '@/lib/api';
import * as api from '@/lib/api';

interface ProfileExtensionsPickerProps {
  profileId: string;
  onChange?: (extensionIds: string[]) => void;
}

export function ProfileExtensionsPicker({ profileId, onChange }: ProfileExtensionsPickerProps) {
  const { t } = useTranslation("extensions");
  const [allExtensions, setAllExtensions] = useState<ExtensionData[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, assigned] = await Promise.all([api.getExtensions('ALL'), api.getProfileExtensions(profileId)]);
      setAllExtensions(all.filter((e) => e.is_active));
      setAssignedIds(new Set(assigned.map((e) => e.id)));
    } catch (err) {
      console.error('Failed to load extensions:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (extId: string) => {
    const newSet = new Set(assignedIds);
    if (newSet.has(extId)) {
      newSet.delete(extId);
    } else {
      newSet.add(extId);
    }
    setAssignedIds(newSet);

    const ids = Array.from(newSet);
    try {
      await api.setProfileExtensions(profileId, ids);
      onChange?.(ids);
    } catch (err) {
      console.error('Failed to update profile extensions:', err);
      // Revert
      setAssignedIds(assignedIds);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400 py-4 text-center">{t('profileEditor.extensions.loading', 'Loading extensions...')}</div>;
  }

  if (allExtensions.length === 0) {
    return <div className="text-sm text-slate-400 py-4 text-center">{t('profileEditor.extensions.noExtensions', 'No extensions available. Upload one from the Extensions page.')}</div>;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {t('profileEditor.extensions.title', 'Chrome Extensions')} ({t('profileEditor.extensions.selected', { count: assignedIds.size })})
      </label>
      <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-2">
        {allExtensions.map((ext) => {
          const isSelected = assignedIds.has(ext.id);
          return (
            <button
              type="button"
              key={ext.id}
              onClick={() => toggle(ext.id)}
              className={`w-full flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              {/* Icon */}
              {ext.icon_path ? (
                <img
                  src={api.getExtensionIconUrl(ext.id)}
                  alt=""
                  className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Puzzle className="w-3 h-3 text-primary" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{ext.name}</div>
                {ext.version && <div className="text-[10px] text-slate-400">v{ext.version}</div>}
              </div>

              {/* Checkbox */}
              <div
                className={`w-3.5 h-3.5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'border my-px border-slate-300 dark:border-slate-600'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
