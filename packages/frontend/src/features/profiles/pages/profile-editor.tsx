import { useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Cookie, Fingerprint, Globe, Loader2, Puzzle, Settings, Sliders } from 'lucide-react';

import { request } from '@/lib/request';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/useUIStore';
import { useProxyStore } from '../../proxy/store';
import { useGroupStore } from '../../groups/store';
import { useAppStore } from '../../profiles/store';
import { checkProxy, getProfile } from '../../profiles/api';
import { ProfileExtensionsPicker as ExtensionsPicker } from '../../extensions/ProfileExtensionsPicker';

import { ProxySection } from '../components/sections/ProxySection';
import { CookieSection } from '../components/sections/CookieSection';
import { OverviewPanel } from '../components/sections/OverviewPanel';
import { GeneralSection } from '../components/sections/GeneralSection';
import { AdvancedSection } from '../components/sections/AdvancedSection';
import { FingerprintSection } from '../components/sections/FingerprintSection';
import { FormRow, SectionDivider, TabButton } from '../components/FormLayoutUtils';
import { buildProfilePayload, buildRandomizedProfileIdentity, generateUA, getDefaultHardware, getDefaultProfileForm, mapProfileToForm, parseProxyPaste } from '../helpers';

import type { ProfileForm, ProxyCheckResult, WebglOption, WebglOptionsResponse } from '../../profiles/types';

type TabType = 'general' | 'proxy' | 'platform' | 'fingerprint' | 'cookie' | 'advanced' | 'extensions';

function osToPlatform(os: string): string {
  if (os === 'windows') return 'windows';
  if (os === 'mac' || os === 'mac_apple_silicon') return 'macos';
  if (os === 'linux') return 'linux';
  if (os === 'android') return 'android';
  return 'windows';
}

export function ProfileEditor() {
  const navigate = useNavigate();
  const { t } = useTranslation("profiles");
  const { id: editingProfileId } = useParams<{ id: string }>();

  const { groups, loadGroups } = useGroupStore();
  const { proxies, loadProxies, addProxies } = useProxyStore();
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { createProfile, updateProfile, loadProfiles } = useAppStore();

  const [cookieText, setCookieText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [proxyTab, setProxyTab] = useState('Custom');
  const [isCheckingProxy, setIsCheckingProxy] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [selectedGpu, setSelectedGpu] = useState<WebglOption | null>(null);
  const [proxyCheck, setProxyCheck] = useState<ProxyCheckResult | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => getDefaultProfileForm());
  const [storedUnmaskedRenderer, setStoredUnmaskedRenderer] = useState<string>('');
  const [selectedCopyDomain, setSelectedCopyDomain] = useState<string | null>(null);
  const [webglOptions, setWebglOptions] = useState<WebglOptionsResponse | null>(null);
  const [cookieValidationError, setCookieValidationError] = useState<string | null>(null);

  const isManualScrolling = useRef(false);
  const originalCookieTextRef = useRef<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = !!editingProfileId;

  useEffect(() => {
    loadGroups();
    loadProxies();
  }, [loadGroups, loadProxies]);

  useEffect(() => {
    if (editingProfileId) {
      getProfile(editingProfileId).then((profile) => {
        const mapped = mapProfileToForm(profile);
        setForm(mapped.form);
        setCookieText(mapped.cookieText);
        originalCookieTextRef.current = mapped.cookieText;
        setStoredUnmaskedRenderer(mapped.storedUnmaskedRenderer);
      });
    }
  }, [editingProfileId]);

  useEffect(() => {
    const profileLabel = isEditing
      ? form.name
        ? `${t('editor.breadcrumbs.detailPrefix', 'Detail: ')}${form.name}`
        : `${t('editor.breadcrumbs.detailShortPrefix', 'Detail #')}${editingProfileId?.substring(0, 5)}...`
      : t('editor.breadcrumbs.newProfile', 'Create new profile');
    setBreadcrumbs([{ label: t('common.home', 'Home'), path: '/' }, { label: t('sidebar.items.Profiles', 'Profiles'), path: '/' }, { label: profileLabel }]);
    return () => setBreadcrumbs([]);
  }, [isEditing, form.name, editingProfileId, setBreadcrumbs]);

  useEffect(() => {
    const platform = osToPlatform(form.os || 'windows');
    request<WebglOptionsResponse>(`/profiles/webgl-options?platform=${platform}`)
      .then((resp: WebglOptionsResponse) => {
        setWebglOptions(resp);
        if (storedUnmaskedRenderer) {
          const match = resp.options.find((o) => o.unmaskedRenderer === storedUnmaskedRenderer);
          setSelectedGpu(match ?? resp.options[0] ?? null);
        } else {
          setSelectedGpu(resp.options[0] ?? null);
        }
      })
      .catch(() => setWebglOptions(null));
  }, [form.os, storedUnmaskedRenderer]);

  const updateField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOSChange = (newOs: string) => {
    setForm((prev) => {
      const next = { ...prev, os: newOs };
      const hw = getDefaultHardware(newOs);
      next.hardware_concurrency = hw.concurrency;
      next.device_memory = hw.memory;
      next.user_agent = generateUA(newOs, prev.ua_version || '146');
      return next;
    });
  };

  const handleCheckProxy = async () => {
    if (!form.proxy_host || !form.proxy_port) return;
    setIsCheckingProxy(true);
    setProxyCheck(null);
    try {
      const result = await checkProxy({
        proxy_type: form.proxy_type,
        proxy_host: form.proxy_host,
        proxy_port: form.proxy_port,
        proxy_username: form.proxy_username,
        proxy_password: form.proxy_password,
      });
      setProxyCheck(result);
      if (result.ok && form.fingerprint_options) {
        const fpOptions = { ...form.fingerprint_options };
        setForm((prev) => ({ ...prev, fingerprint_options: fpOptions }));
      }
    } catch {
      setProxyCheck({ ok: false, error: t('editor.proxy.cannotConnect', 'Cannot connect') });
    } finally {
      setIsCheckingProxy(false);
    }
  };

  const handleClearProxy = (e: React.MouseEvent) => {
    e.preventDefault();
    updateField('proxy_type', 'http');
    updateField('proxy_host', '');
    updateField('proxy_port', undefined);
    updateField('proxy_username', '');
    updateField('proxy_password', '');
    updateField('proxy_reset_url', '');
    setProxyCheck(null);
  };

  const handleProxyPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parsed = parseProxyPaste(e.clipboardData.getData('text'), form.proxy_type || 'http');
    if (!parsed) return;
    e.preventDefault();
    setForm((prev) => ({
      ...prev,
      proxy_host: parsed.host,
      ...(parsed.port ? { proxy_port: parsed.port } : {}),
      ...(parsed.username ? { proxy_username: parsed.username } : {}),
      ...(parsed.password ? { proxy_password: parsed.password } : {}),
      ...(parsed.proxy_type ? { proxy_type: parsed.proxy_type } : {}),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      const payload = buildProfilePayload({ form, cookieText, proxyCheck, selectedGpu });
      if (isEditing && editingProfileId) {
        await updateProfile(editingProfileId, payload);
      } else {
        await createProfile(payload);
      }

      // Lưu proxy vào hệ thống (chạy ngầm không đợi)
      if (form.proxy_host && form.proxy_port) {
        addProxies([
          {
            name: `${t('editor.proxy.autoSavedPrefix', '[Profile]')} ${form.name}`,
            type: form.proxy_type || 'http',
            host: form.proxy_host,
            port: Number(form.proxy_port),
            username: form.proxy_username || '',
            password: form.proxy_password || '',
          },
        ]).catch((err) => console.error(`${t('editor.proxy.saveError', 'Lỗi khi lưu proxy ngầm:')}`, err));
      }

      await loadProfiles();
      navigate('/');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewFingerprint = () => {
    setForm((prev) => ({
      ...prev,
      ...buildRandomizedProfileIdentity(prev.os || 'windows'),
    }));
    const opts = webglOptions?.options ?? [];
    if (opts.length > 0) {
      setSelectedGpu(opts[Math.floor(Math.random() * opts.length)]);
    }
  };

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    isManualScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 800);
    const el = document.getElementById(`section-${tabId}`);
    const container = scrollContainerRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 32, behavior: 'smooth' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isManualScrolling.current) return;
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop + container.clientHeight / 3;
    const sections: TabType[] = ['general', 'proxy', 'platform', 'fingerprint', 'cookie', 'advanced', 'extensions'];
    let currentSection = sections[0];
    const isBottom = Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 2;
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(`section-${sections[i]}`);
      if (el && (isBottom || scrollPosition >= el.offsetTop)) {
        currentSection = sections[i];
        break;
      }
    }
    if (activeTab !== currentSection) setActiveTab(currentSection);
  };

  return (
    <div className="flex flex-col h-full pt-4">
      <div className="flex flex-col flex-1 bg-white/80 backdrop-blur-md dark:bg-slate-800/80 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-6 mb-6 overflow-hidden border border-border/50">
        <div className="flex items-end px-2 pt-2 border-b border-border/50 bg-background/40">
          <div className="flex items-center space-x-6">
            <TabButton active={activeTab === 'general'} onClick={() => handleTabClick('general')}>
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                {t('editor.tabs.general')}
              </span>
            </TabButton>
            <TabButton active={activeTab === 'proxy'} onClick={() => handleTabClick('proxy')}>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {t('editor.tabs.proxy', 'Proxy')}
              </span>
            </TabButton>
            <TabButton active={activeTab === 'fingerprint'} onClick={() => handleTabClick('fingerprint')}>
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                {t('editor.tabs.fingerprint')}
              </span>
            </TabButton>
            <TabButton active={activeTab === 'cookie'} onClick={() => handleTabClick('cookie')}>
              <span className="flex items-center gap-1.5">
                <Cookie className="w-3.5 h-3.5" />
                {t('editor.tabs.cookie', 'Cookie')}
                {cookieText.trim() &&
                  (() => {
                    try {
                      const c = JSON.parse(cookieText);
                      return Array.isArray(c) && c.length > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold leading-none px-1.5 py-0.5 min-w-[18px]">
                          {c.length}
                        </span>
                      ) : null;
                    } catch {
                      return null;
                    }
                  })()}
              </span>
            </TabButton>
            <TabButton active={activeTab === 'advanced'} onClick={() => handleTabClick('advanced')}>
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                {t('editor.tabs.advanced')}
              </span>
            </TabButton>
            {isEditing && (
              <TabButton active={activeTab === 'extensions'} onClick={() => handleTabClick('extensions')}>
                <span className="flex items-center gap-1.5">
                  <Puzzle className="w-3.5 h-3.5" />
                  {t('editor.tabs.extensions')}
                </span>
              </TabButton>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative overflow-y-auto custom-scrollbar p-8 bg-white/40 dark:bg-slate-900/40 scroll-smooth" ref={scrollContainerRef} onScroll={handleScroll}>
            <GeneralSection form={form} groups={groups} updateField={updateField} handleOSChange={handleOSChange} />

            <ProxySection
              form={form}
              proxyTab={proxyTab}
              setProxyTab={setProxyTab}
              proxies={proxies}
              proxyCheck={proxyCheck}
              isCheckingProxy={isCheckingProxy}
              updateField={updateField}
              handleCheckProxy={handleCheckProxy}
              handleClearProxy={handleClearProxy}
              handleProxyPaste={handleProxyPaste}
            />

            <FingerprintSection form={form} setForm={setForm} proxyCheck={proxyCheck} webglOptions={webglOptions} selectedGpu={selectedGpu} setSelectedGpu={setSelectedGpu} />

            <CookieSection
              cookieText={cookieText}
              setCookieText={setCookieText}
              cookieValidationError={cookieValidationError}
              setCookieValidationError={setCookieValidationError}
              isEditing={isEditing}
              originalCookieText={originalCookieTextRef.current}
              selectedCopyDomain={selectedCopyDomain}
              setSelectedCopyDomain={setSelectedCopyDomain}
              copiedDomain={copiedDomain}
              setCopiedDomain={setCopiedDomain}
              t={t}
            />

            {isEditing && editingProfileId && (
              <div id="section-extensions" className="space-y-8 py-8">
                <SectionDivider label={t('editor.tabs.extensions', 'Extensions')} />
                <FormRow label={t('editor.extensions.title', 'Chrome Extensions')}>
                  <div className="w-full">
                    <ExtensionsPicker profileId={editingProfileId} />
                  </div>
                </FormRow>
              </div>
            )}

            <AdvancedSection form={form} updateField={updateField} />
          </div>

          <OverviewPanel form={form} cookieText={cookieText} isEditing={isEditing} handleNewFingerprint={handleNewFingerprint} />
        </div>

        <div className="p-4 border-t border-border/50 bg-background/60 flex items-center justify-end gap-4 px-8">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 w-32 shadow-md hover:shadow-lg transition-all"
            onClick={handleSave}
            disabled={isSaving || !form.name.trim()}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? t('editor.actions.save') : t('editor.actions.create')}
          </Button>
          <Button variant="ghost" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-6 font-medium" onClick={() => navigate('/')}>
            {t('editor.actions.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
