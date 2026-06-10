import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProfileForm } from '../../profiles/types';
import { OverviewRow } from '../FormLayoutUtils';

export interface OverviewPanelProps {
  form: ProfileForm;
  cookieText: string;
  isEditing: boolean;
  handleNewFingerprint: () => void;
}

export function OverviewPanel({ form, cookieText, isEditing, handleNewFingerprint }: OverviewPanelProps) {
  const { t } = useTranslation("profiles");

  const cookieCount = (() => {
    try {
      const c = JSON.parse(cookieText);
      return Array.isArray(c) && c.length > 0 ? t('editor.overview.cookiesCount', '{{count}} cookies', { count: c.length }) : t('editor.overview.none', 'Không có');
    } catch {
      return cookieText.trim() ? t('editor.overview.jsonError', '⚠ Lỗi JSON') : t('editor.overview.none', 'Không có');
    }
  })();

  const resolveResolutionLabel = (val: string | undefined, customVal?: string) => {
    if (!val || val === 'default') return t('editor.fingerprint.default', 'Default');
    if (val === 'auto_fit') return t('editor.fingerprint.autoFit', 'Auto fit screen');
    if (val === 'custom') return customVal ? customVal : t('editor.fingerprint.custom', 'Custom');
    return val;
  };

  const resolveIpBasedLabel = (val: string | undefined, extraMatch?: string) => {
    if (!val || val === 'based_on_ip') return t('editor.fingerprint.basedOnIP', 'Based on IP');
    if (val === 'based_on_language') return t('editor.fingerprint.basedOnLanguage', 'Based on language');
    if (val === 'custom') return t('editor.fingerprint.custom', 'Custom');
    if (val === 'real') return 'Real';
    if (extraMatch && val === extraMatch) return extraMatch;
    return val;
  };

  return (
    <div className="hidden xl:flex w-[380px] border-l border-border/50 bg-slate-50/80 dark:bg-slate-900/60 p-6 flex-col">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{t('editor.overview.title')}</h3>
        <Button variant="ghost" size="sm" onClick={handleNewFingerprint} className="font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-full h-8 px-4">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          {t('editor.overview.newFingerprint')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 text-sm">
        <OverviewRow label="Browser Kernel" value={`Botzvn [${form.ua_version}]`} />
        <OverviewRow
          label="OS"
          value={form.os === 'mac' ? 'macOS' : form.os === 'windows' ? 'Windows' : form.os === 'linux' ? 'Linux' : form.os === 'android' ? 'Android' : form.os === 'ios' ? 'iOS' : String(form.os)}
        />
        <OverviewRow
          label="WebRTC"
          value={
            form.fingerprint_options?.webrtc === 'Manual'
              ? form.fingerprint_options?.webrtc_ip
                ? t('editor.overview.manual', { ip: form.fingerprint_options.webrtc_ip })
                : t('editor.overview.manualEmpty')
              : form.fingerprint_options?.webrtc || 'Disable UDP'
          }
        />
        <OverviewRow label={t('editor.fingerprint.timezone')} value={resolveIpBasedLabel(form.fingerprint_options?.timezone, 'Real')} />
        <OverviewRow label={t('editor.fingerprint.location')} value={resolveIpBasedLabel(form.fingerprint_options?.location, 'Block')} />
        <OverviewRow label={t('editor.fingerprint.language')} value={resolveIpBasedLabel(form.fingerprint_options?.language, 'Real')} />
        <OverviewRow label={t('editor.fingerprint.resolution')} value={resolveResolutionLabel(form.fingerprint_options?.resolution, form.fingerprint_options?.custom_resolution)} />
        <OverviewRow label={t('editor.fingerprint.displayLanguage')} value={resolveIpBasedLabel(form.fingerprint_options?.display_language, 'Real')} />
        <OverviewRow label="Proxy" value={form.proxy_host && form.proxy_port ? `${form.proxy_type}://${form.proxy_host}:${form.proxy_port}` : t('editor.overview.noProxy')} />
        <OverviewRow label="Canvas" value={form.fingerprint_options?.hardware?.canvas !== false ? 'Spoof' : 'Real'} />
        <OverviewRow label="WebGL" value={form.fingerprint_options?.hardware?.webgl !== false ? 'Spoof' : 'Real'} />
        <OverviewRow label="AudioContext" value={form.fingerprint_options?.hardware?.audioContext !== false ? 'Spoof' : 'Real'} />
        <OverviewRow label="MediaDevices" value={form.fingerprint_options?.hardware?.mediaDevices !== false ? 'Auto (Spoof)' : 'Real'} />
        <OverviewRow label="Client Rects" value={form.fingerprint_options?.hardware?.clientRects !== false ? 'Spoof' : 'Real'} />
        <OverviewRow label="Network Info" value={form.fingerprint_options?.hardware?.networkInfo !== false ? 'Spoof' : 'Real'} />
        <OverviewRow label="SpeechVoices" value={form.fingerprint_options?.hardware?.speechVoices !== false ? 'Spoof' : 'Real'} />
        <OverviewRow label="Cookies" value={cookieCount} />
        <OverviewRow
          label="Startup Args"
          value={
            (form.startup_args as string[] | undefined)?.length
              ? t('editor.overview.flagsCount', '{{count}} flag(s)', { count: (form.startup_args as string[]).length })
              : t('editor.fingerprint.default', 'Mặc định')
          }
        />
      </div>

      <div className="pt-4 border-t border-border/50 mt-4 text-xs text-slate-500">
        {isEditing ? t('editor.overview.editingProfile') : t('editor.overview.creatingProfile')} {t('editor.overview.fingerprintNote')}
      </div>
    </div>
  );
}
