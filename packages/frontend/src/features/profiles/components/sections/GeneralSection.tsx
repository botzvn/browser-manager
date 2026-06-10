import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, FileText, Lock, RefreshCw, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProfileForm } from '../../profiles/types';
import { UA_FULL_VERSIONS, UA_VERSIONS } from '../../constants';
import { generateUA, osToUAKey } from '../../helpers';
import { FormRow, OsButton } from '../FormLayoutUtils';
import { TagInput } from '../TagInput';

interface Group {
  id: string;
  name: string;
  color?: string;
}

export interface GeneralSectionProps {
  form: ProfileForm;
  groups: Group[];
  updateField: <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => void;
  handleOSChange: (os: string) => void;
}

export function GeneralSection({ form, groups, updateField, handleOSChange }: GeneralSectionProps) {
  const { t } = useTranslation("profiles");

  return (
    <div id="section-general" className="space-y-8 pb-8">
      <FormRow label={t('editor.general.name')}>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={t('editor.general.namePlaceholder')}
              className="pr-16 h-10 rounded-lg px-4"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{form.name.length} / 100</div>
          </div>

          <div className="w-1/3 min-w-[200px]">
            <Select
              value={form.group_id || 'uncategorized'}
              onValueChange={(val) => updateField('group_id', val === 'uncategorized' ? undefined : (val as string))}
            >
              <SelectTrigger className="w-full outline-none h-10 px-4 transition-all">
                <SelectValue placeholder={t('editor.general.selectGroup')}>
                  {form.group_id && groups.length > 0
                    ? groups.find((g) => g.id === form.group_id)?.name || form.group_id
                    : form.group_id
                      ? 'Loading...'
                      : t('editor.general.uncategorized')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">{t('editor.general.uncategorized')}</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color || '#64748b' }} />
                      <span>{g.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormRow>

      <FormRow label={t('editor.general.os')} overflowVisible={true}>
        <OsSelectorField form={form} handleOSChange={handleOSChange} />
      </FormRow>

      <UserAgentField form={form} updateField={updateField} />

      <FormRow label={t('editor.general.tags', 'Tags')}>
        <TagInput value={form.tags || ''} onChange={(val) => updateField('tags', val)} />
      </FormRow>

      <FormRow label={t('editor.general.notes', 'Ghi chú')}>
        <div className="relative">
          <textarea
            value={form.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder={t('editor.general.notesPlaceholder', 'Ghi chú về profile này...')}
            className="flex w-full rounded-lg bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus:outline-none focus:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] transition-shadow min-h-[80px] resize-y"
            maxLength={1500}
          />
          <div className="absolute right-3 bottom-3 text-xs text-slate-400">{(form.notes || '').length} / 1500</div>
        </div>
      </FormRow>
    </div>
  );
}

function OsSelectorField({ form, handleOSChange }: { form: ProfileForm; handleOSChange: (os: string) => void }) {
  const { t } = useTranslation("profiles");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; osLabel: string }>({ visible: false, osLabel: '' });

  const showProToast = (osLabel: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, osLabel });
    timerRef.current = setTimeout(() => setToast({ visible: false, osLabel: '' }), 3500);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <OsButton active={form.os === 'linux'} onClick={() => handleOSChange('linux')} label="Linux" icon={<Terminal className="w-4 h-4" />} />
        <OsButton
          active={form.os === 'windows'}
          onClick={() => handleOSChange('windows')}
          label="Windows"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
            </svg>
          }
        />
        <OsButton proOnly active={false} onClick={() => showProToast('macOS (Apple Silicon)')} label="Mac (M)" icon={<Apple className="w-4 h-4" />} />
        <OsButton proOnly active={false} onClick={() => showProToast('macOS (Intel)')} label="Mac (Intel)" icon={<Apple className="w-4 h-4" />} />
        <OsButton
          proOnly
          active={false}
          onClick={() => showProToast('Android')}
          label="Android"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1.5c-.96 0-1.86.23-2.66.63L7.86.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C7.14 3.79 6.5 5.3 6.5 7h11c0-1.7-.64-3.21-1.97-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
            </svg>
          }
        />
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${toast.visible ? 'max-h-16 opacity-100 mt-2.5' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-700/30">
          <div className="shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
            <span className="font-semibold">{toast.osLabel}</span> {t('editor.general.proOsPrefix', 'chỉ khả dụng khi dùng')}{' '}
            <span className="font-semibold text-orange-600 dark:text-orange-400">Docker Image Pro</span>{' '}
            {t('editor.general.proOsOr', 'hoặc')} <span className="font-semibold text-orange-600 dark:text-orange-400">Pro-Lite</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function UserAgentField({ form, updateField }: { form: ProfileForm; updateField: <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => void }) {
  return (
    <FormRow label="User-Agent">
      <div className="flex items-center w-full h-9 rounded-lg bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] transition-shadow overflow-hidden">
        <Select
          value={form.ua_version ?? '146'}
          onValueChange={(ver) => {
            if (!ver) return;
            const uaOs = osToUAKey(form.os || 'windows');
            const firstFull = UA_FULL_VERSIONS[ver]?.[0] ?? '';
            updateField('ua_version', ver);
            updateField('ua_full_version', firstFull);
            updateField('user_agent', generateUA(uaOs, ver));
          }}
        >
          <SelectTrigger className="h-9 w-20 border-0 border-r border-input rounded-none shadow-none focus:ring-0 bg-transparent text-sm font-medium px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UA_VERSIONS.map((v: string) => (
              <SelectItem key={v} value={v}>
                UA {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={form.ua_full_version ?? UA_FULL_VERSIONS[form.ua_version ?? '146']?.[0] ?? ''}
          onValueChange={(fv) => {
            if (fv) updateField('ua_full_version', fv);
          }}
        >
          <SelectTrigger className="h-9 w-34 border-0 border-r border-input rounded-none shadow-none focus:ring-0 bg-transparent text-sm px-3 text-slate-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(UA_FULL_VERSIONS[form.ua_version ?? '146'] ?? []).map((fv: string) => (
              <SelectItem key={fv} value={fv}>
                {fv}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 min-w-0 overflow-x-auto h-full flex items-center px-3">
          <span className="text-xs text-slate-400 whitespace-nowrap font-mono">{form.user_agent}</span>
        </div>
        <div className="flex items-center shrink-0 border-l border-input">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-none border-r border-input"
            title="Copy UA"
            onClick={() => navigator.clipboard.writeText(form.user_agent || '')}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-9 w-9 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-none"
            title="Random UA"
            onClick={() => {
              const randomVer = UA_VERSIONS[Math.floor(Math.random() * UA_VERSIONS.length)];
              const uaOs = osToUAKey(form.os || 'windows');
              const firstFull = UA_FULL_VERSIONS[randomVer]?.[0] ?? '';
              updateField('ua_version', randomVer);
              updateField('ua_full_version', firstFull);
              updateField('user_agent', generateUA(uaOs, randomVer));
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </FormRow>
  );
}
