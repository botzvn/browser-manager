import { useTranslation } from 'react-i18next';
import { CheckCircle, RefreshCw } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { DisabledToggleRow, FormRow, SectionDivider, SegmentedControl } from '../FormLayoutUtils';

import type { ProfileForm, ProxyCheckResult, WebglOption, WebglOptionsResponse } from '../../profiles/types';

export interface FingerprintSectionProps {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  proxyCheck: ProxyCheckResult | null;
  webglOptions: WebglOptionsResponse | null;
  selectedGpu: WebglOption | null;
  setSelectedGpu: (gpu: WebglOption | null) => void;
}

export function FingerprintSection({ form, setForm, proxyCheck, webglOptions, selectedGpu, setSelectedGpu }: FingerprintSectionProps) {
  const { t } = useTranslation("profiles");

  const updateFp = (key: string, val: unknown) => {
    setForm((prev) => ({ ...prev, fingerprint_options: { ...prev.fingerprint_options!, [key]: val } }));
  };

  return (
    <div id="section-fingerprint" className="space-y-8 py-8">
      <SectionDivider label={t('editor.fingerprint.title')} />

      <FormRow label="WebRTC">
        <div className="space-y-3">
          <SegmentedControl options={['Off', 'Real', 'Disable UDP', 'Altered', 'Manual']} active={form.fingerprint_options?.webrtc || 'Disable UDP'} onChange={(val) => updateFp('webrtc', val)} />
          {form.fingerprint_options?.webrtc === 'Manual' && (
            <Input
              value={form.fingerprint_options.webrtc_ip || ''}
              onChange={(e) => updateFp('webrtc_ip', e.target.value)}
              placeholder={t('editor.fingerprint.spoofIP')}
              className="w-full bg-white dark:bg-slate-800"
            />
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.timezone')}>
        <div className="space-y-2">
          <SegmentedControl
            options={[
              { value: 'based_on_ip', label: t('editor.fingerprint.basedOnIP', 'Based on IP') },
              { value: 'real', label: t('editor.fingerprint.real', 'Real') },
              { value: 'custom', label: t('editor.fingerprint.custom', 'Custom') },
            ]}
            active={form.fingerprint_options?.timezone || 'based_on_ip'}
            onChange={(val) => updateFp('timezone', val)}
          />
          {form.fingerprint_options?.timezone === 'based_on_ip' && proxyCheck?.timezone && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> {t('editor.fingerprint.gotFromProxy')}: {proxyCheck.timezone}
            </div>
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.location')}>
        <div className="space-y-4">
          <SegmentedControl
            options={[
              { value: 'based_on_ip', label: t('editor.fingerprint.basedOnIP', 'Based on IP') },
              { value: 'custom', label: t('editor.fingerprint.custom', 'Custom') },
              { value: 'block', label: 'Block' },
            ]}
            active={form.fingerprint_options?.location || 'based_on_ip'}
            onChange={(val) => updateFp('location', val)}
          />
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="locAction" defaultChecked className="accent-primary" /> {t('editor.fingerprint.askEveryTime', 'Ask every time')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="locAction" className="accent-primary" /> {t('editor.fingerprint.alwaysAllow', 'Always allow')}
            </label>
          </div>
          {form.fingerprint_options?.location === 'based_on_ip' && proxyCheck?.latitude && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> {t('editor.fingerprint.gotFromProxy')}: {proxyCheck.latitude}, {proxyCheck.longitude}
            </div>
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.language')}>
        <div className="space-y-2">
          <SegmentedControl
            options={[
              { value: 'based_on_ip', label: t('editor.fingerprint.basedOnIP', 'Based on IP') },
              { value: 'real', label: t('editor.fingerprint.real', 'Real') },
              { value: 'custom', label: t('editor.fingerprint.custom', 'Custom') },
            ]}
            active={form.fingerprint_options?.language || 'based_on_ip'}
            onChange={(val) => updateFp('language', val)}
          />
          {form.fingerprint_options?.language === 'custom' && (
            <Input
              type="text"
              className="w-full h-9 bg-white dark:bg-slate-800"
              placeholder={t('editor.fingerprint.languagePlaceholder', 'e.g. vi-VN, vi, en-US, en')}
              value={form.fingerprint_options?.custom_language || ''}
              onChange={(e) => updateFp('custom_language', e.target.value)}
            />
          )}
          {form.fingerprint_options?.language === 'based_on_ip' && proxyCheck?.languages && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> {t('editor.fingerprint.gotFromProxy')}: {proxyCheck.languages}
            </div>
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.displayLanguage')}>
        <div className="space-y-2">
          <SegmentedControl
            options={[
              { value: 'based_on_language', label: t('editor.fingerprint.basedOnLanguage', 'Based on language') },
              { value: 'real', label: t('editor.fingerprint.real', 'Real') },
              { value: 'custom', label: t('editor.fingerprint.custom', 'Custom') },
            ]}
            active={form.fingerprint_options?.display_language || 'based_on_language'}
            onChange={(val) => updateFp('display_language', val)}
          />
          {form.fingerprint_options?.display_language === 'custom' && (
            <Input
              type="text"
              className="w-full h-9 bg-white dark:bg-slate-800"
              placeholder={t('editor.fingerprint.displayLanguagePlaceholder', 'e.g. en')}
              value={form.fingerprint_options?.custom_display_language || ''}
              onChange={(e) => updateFp('custom_display_language', e.target.value)}
            />
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.resolution')}>
        <div className="space-y-3">
          <SegmentedControl
            options={[
              { value: 'default', label: t('editor.fingerprint.default', 'Default') },
              { value: 'auto_fit', label: t('editor.fingerprint.autoFit', 'Auto fit screen') },
              { value: 'custom', label: t('editor.fingerprint.custom', 'Custom') },
            ]}
            active={form.fingerprint_options?.resolution || 'auto_fit'}
            onChange={(val) => updateFp('resolution', val)}
          />
          {(form.fingerprint_options?.resolution || 'auto_fit') === 'default' ? (
            <div className="text-sm text-slate-500 italic mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">{t('editor.fingerprint.resolutionDefaultDesc')}</div>
          ) : (form.fingerprint_options?.resolution || 'auto_fit') === 'auto_fit' ? (
            <div className="text-sm text-slate-500 italic mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">{t('editor.fingerprint.resolutionAutoDesc')}</div>
          ) : (
            <Input
              type="text"
              className="w-full max-w-sm h-9 bg-white dark:bg-slate-800"
              placeholder={t('editor.fingerprint.resolutionPlaceholder', 'e.g. 1920x1080')}
              value={form.fingerprint_options?.custom_resolution || ''}
              onChange={(e) => updateFp('custom_resolution', e.target.value)}
            />
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.fonts')}>
        <div className="space-y-3">
          <SegmentedControl
            options={[
              { value: 'default', label: t('editor.fingerprint.default', 'Default') },
              { value: 'custom', label: t('editor.fingerprint.custom', 'Custom') },
            ]}
            active={form.fingerprint_options?.fonts || 'default'}
            onChange={(val) => updateFp('fonts', val)}
          />
          {form.fingerprint_options?.fonts === 'custom' && (
            <textarea
              className="w-full rounded-lg bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] transition-shadow"
              placeholder={t('editor.fingerprint.fontsPlaceholder', 'e.g. Arial, Helvetica, Verdana, Georgia, Times New Roman')}
              rows={2}
              value={form.fingerprint_options?.custom_fonts || ''}
              onChange={(e) => updateFp('custom_fonts', e.target.value)}
            />
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.fingerprint.hardwareSpecs')}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <div className="text-xs text-slate-500 font-medium">{t('editor.fingerprint.cpuCores')}</div>
            <Select value={form.hardware_concurrency?.toString()} onValueChange={(v) => setForm((prev) => ({ ...prev, hardware_concurrency: Number(v) }))}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[4, 6, 8, 10, 12, 16].map((cores) => (
                  <SelectItem key={cores} value={cores.toString()}>
                    {cores} Cores
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs text-slate-500 font-medium">{t('editor.fingerprint.ramCapacity')}</div>
            <Select value={form.device_memory?.toString()} onValueChange={(v) => setForm((prev) => ({ ...prev, device_memory: Number(v) }))}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 4, 8, 16, 32].map((ram) => (
                  <SelectItem key={ram} value={ram.toString()}>
                    {ram} GB
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormRow>

      <FormRow
        label={
          <span className="flex flex-col items-end gap-1">
            {t('editor.fingerprint.hardware', 'Hardware')}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">PRO</span>
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 opacity-50 pointer-events-none select-none">
          <DisabledToggleRow label="Canvas" tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')} />
          <DisabledToggleRow label="Avatar WebGL" tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')} />
          <DisabledToggleRow label="AudioContext" tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')} />
          <DisabledToggleRow
            label={t('editor.fingerprint.mediaDevices', 'Media Devices [Auto]')}
            tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')}
          />
          <DisabledToggleRow label="Client Rects" tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')} />
          <DisabledToggleRow label="SpeechVoices" tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')} />
          <DisabledToggleRow label="Network Info" tooltip={t('editor.fingerprint.proFeatureTooltip', 'This feature is only available on Pro or ProLite versions.')} />
        </div>
      </FormRow>

      {/* <SectionDivider label={t('editor.fingerprint.webglMetadata', 'WebGL Metadata')} /> */}

      <FormRow label={t('editor.fingerprint.webglMetadata', 'WebGL Metadata')}>
        <div className="relative flex gap-2 items-center min-w-0">
          <Select
            value={selectedGpu ? selectedGpu.unmaskedRenderer : ''}
            onValueChange={(val) => {
              const found = webglOptions?.options.find((o) => o.unmaskedRenderer === val);
              if (found) setSelectedGpu(found);
            }}
          >
            <SelectTrigger className="h-9 w-full flex-1 min-w-0 overflow-hidden bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] font-medium border-0">
              <span className="block w-full truncate text-left min-w-0">
                {webglOptions === null
                  ? t('editor.fingerprint.loadingGpu', 'Loading GPU...')
                  : selectedGpu
                    ? selectedGpu.label || selectedGpu.unmaskedRenderer
                    : t('editor.fingerprint.selectGpu', 'Select GPU...')}
              </span>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {webglOptions === null ? (
                <SelectItem value="">{t('editor.fingerprint.loading', 'Loading...')}</SelectItem>
              ) : (
                <>
                  {webglOptions.options.map((opt) => (
                    <SelectItem key={opt.unmaskedRenderer} value={opt.unmaskedRenderer}>
                      <span className="block max-w-sm truncate">{opt.label || opt.unmaskedRenderer}</span>
                    </SelectItem>
                  ))}
                  {webglOptions.tier === 'free' && webglOptions.lockedCount && webglOptions.lockedCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 border-t border-border/50 select-none cursor-not-allowed">
                      <span>🔒</span>
                      <span>
                        {t('editor.fingerprint.upgradeForMoreGpus', 'Switch to Docker Image Pro to unlock {{lockedCount}} more options ({{moreCount}} GPUs more)', {
                          lockedCount: webglOptions.lockedCount,
                          moreCount: webglOptions.totalCount - 3,
                        })}
                      </span>
                    </div>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="text-primary hover:bg-primary/10 h-9 w-9 shrink-0"
            title="Random GPU"
            onClick={() => {
              const opts = webglOptions?.options ?? [];
              if (opts.length > 0) setSelectedGpu(opts[Math.floor(Math.random() * opts.length)]);
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </FormRow>

      {/* {selectedGpu && (
        <div className="grid grid-cols-[128px_1fr] gap-x-6 gap-y-2">
          <div className="text-sm text-slate-500 font-medium self-center text-right">Vendor</div>
          <div className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] truncate">
            {selectedGpu.vendor}
          </div>
          <div className="text-sm text-slate-500 font-medium self-center text-right">Renderer</div>
          <div className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] truncate">
            {selectedGpu.renderer}
          </div>
          <div className="text-sm text-slate-500 font-medium self-center text-right">Unmasked Vendor</div>
          <div className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] truncate">
            {selectedGpu.unmaskedVendor}
          </div>
          <div className="text-sm text-slate-500 font-medium self-center text-right">Unmasked Renderer</div>
          <div className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] break-all">
            {selectedGpu.unmaskedRenderer}
          </div>
        </div>
      )} */}
    </div>
  );
}
