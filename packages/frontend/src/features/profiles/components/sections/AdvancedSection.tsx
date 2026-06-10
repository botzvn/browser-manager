import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import type { ProfileForm } from '../../profiles/types';
import { FormRow, SectionDivider } from '../FormLayoutUtils';
import { StartupArgsInput } from '../StartupArgsInput';

export interface AdvancedSectionProps {
  form: ProfileForm;
  updateField: <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => void;
}

export function AdvancedSection({ form, updateField }: AdvancedSectionProps) {
  const { t } = useTranslation("profiles");

  return (
    <div id="section-advanced" className="space-y-8 py-8 pb-32">
      <SectionDivider label={t('editor.advanced.title', 'Nâng cao')} />

      <FormRow label={t('editor.advanced.startupParameters', 'Startup Parameters')}>
        <div className="space-y-3">
          <StartupArgsInput value={form.startup_args || []} onChange={(val) => updateField('startup_args' as any, val)} />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-medium text-slate-500">{t('editor.advanced.chromiumFlags', 'Chromium Flags:')}</span> {t('editor.advanced.chromiumFlagsDesc1', 'Thêm các flag khởi động tùy chỉnh cho trình duyệt. Ví dụ:')}{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">--disable-gpu</code>,{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">--window-position=0,0</code>,{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">--mute-audio</code>. {t('editor.advanced.chromiumFlagsDesc2', 'Mỗi flag trên một dòng hoặc nhấn')}{' '}
            <kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-sans">Enter</kbd> {t('editor.advanced.chromiumFlagsDesc3', 'để thêm.')}
          </div>
          {(form.startup_args || []).some((a: string) => ['--no-sandbox', '--disable-web-security', '--allow-running-insecure-content'].includes(a)) && (
            <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{t('editor.advanced.securityWarning', 'Một số flag đang dùng có thể giảm bảo mật hoặc bị website phát hiện. Kiểm tra lại trước khi sử dụng.')}</span>
            </div>
          )}
        </div>
      </FormRow>
    </div>
  );
}
