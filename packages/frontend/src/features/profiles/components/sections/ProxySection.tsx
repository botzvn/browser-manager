import { useTranslation } from 'react-i18next';
import { CheckCircle, Copy, Loader2, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProfileForm, ProxyCheckResult } from '../../profiles/types';
import { FormRow, SectionDivider, SegmentedControl } from '../FormLayoutUtils';

interface StoredProxy {
  id: string;
  type: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  name?: string;
}

export interface ProxySectionProps {
  form: ProfileForm;
  proxyTab: string;
  setProxyTab: (tab: string) => void;
  proxies: StoredProxy[];
  proxyCheck: ProxyCheckResult | null;
  isCheckingProxy: boolean;
  updateField: <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => void;
  handleCheckProxy: () => void;
  handleClearProxy: (e: React.MouseEvent) => void;
  handleProxyPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export function ProxySection({ form, proxyTab, setProxyTab, proxies, proxyCheck, isCheckingProxy, updateField, handleCheckProxy, handleClearProxy, handleProxyPaste }: ProxySectionProps) {
  const { t } = useTranslation("profiles");

  return (
    <div id="section-proxy" className="space-y-8 py-8">
      <SectionDivider label={t('editor.tabs.proxy', 'Proxy')} />
      <FormRow label={t('editor.proxy.proxyType')}>
        <SegmentedControl
          options={[
            { value: 'Custom', label: t('editor.fingerprint.custom', 'Custom') },
            { value: 'Proxy đã lưu', label: t('editor.proxy.savedProxy', 'Saved Proxy') },
          ]}
          active={proxyTab}
          onChange={setProxyTab}
        />
      </FormRow>

      {proxyTab === 'Proxy đã lưu' && (
        <FormRow label={t('editor.proxy.proxyStorage')}>
          <Select
            value={proxies.find((p) => p.host === form.proxy_host && p.port === form.proxy_port)?.id || undefined}
            onValueChange={(val) => {
              const found = proxies.find((p) => p.id === val);
              if (found) {
                updateField('proxy_type', found.type);
                updateField('proxy_host', found.host);
                updateField('proxy_port', found.port);
                updateField('proxy_username', found.username || '');
                updateField('proxy_password', found.password || '');
              }
            }}
          >
            <SelectTrigger className="w-full text-primary h-10 px-4">
              <SelectValue placeholder={t('editor.proxy.selectProxy')}>
                {(() => {
                  const p = proxies.find((p) => p.host === form.proxy_host && p.port === form.proxy_port);
                  return p ? `${p.host}:${p.port} ${p.name ? `— ${p.name}` : ''} [${p.type.toUpperCase()}]` : undefined;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {proxies.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.host}:{p.port} {p.name ? `— ${p.name}` : ''} [{p.type.toUpperCase()}]
                </SelectItem>
              ))}
              {proxies.length === 0 && <div className="text-slate-400 p-2 text-sm text-center">{t('editor.proxy.noProxies')}</div>}
            </SelectContent>
          </Select>
        </FormRow>
      )}

      <FormRow label={t('editor.proxy.protocol')}>
        <Select value={form.proxy_type || 'http'} onValueChange={(val) => updateField('proxy_type', val || 'http')}>
          <SelectTrigger className="w-full text-primary font-medium h-10 px-4 uppercase">
            <SelectValue placeholder={t('editor.proxy.selectProtocol')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="http">HTTP</SelectItem>
            <SelectItem value="socks5">SOCKS5</SelectItem>
            <SelectItem value="https">HTTPS</SelectItem>
          </SelectContent>
        </Select>
      </FormRow>

      <FormRow label="Host:Port">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center h-9 w-full rounded-lg bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] transition-shadow overflow-hidden text-sm px-3">
              <input
                type="text"
                value={form.proxy_host || ''}
                onChange={(e) => updateField('proxy_host', e.target.value)}
                onPaste={handleProxyPaste}
                placeholder={t('editor.proxy.hostPlaceholder', 'Host')}
                className="flex-1 bg-transparent border-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 shadow-none px-0 h-full outline-none w-full min-w-0"
              />
              <span className="text-slate-400 px-2">:</span>
              <input
                type="text"
                value={form.proxy_port || ''}
                onChange={(e) => updateField('proxy_port', parseInt(e.target.value) || undefined)}
                placeholder={t('editor.proxy.portPlaceholder', 'Port')}
                className="w-16 bg-transparent border-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 shadow-none px-0 h-full outline-none min-w-0"
              />
            </div>
            <Button
              variant="outline"
              className="shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 text-slate-700 dark:text-slate-300 shrink-0"
              onClick={handleCheckProxy}
              disabled={isCheckingProxy || !form.proxy_host || !form.proxy_port}
            >
              {isCheckingProxy ? <Loader2 className="w-4 h-4 animate-spin" /> : t('editor.proxy.check')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-9 w-9 shrink-0 text-primary hover:bg-primary/10 rounded-lg border-0 shadow-none"
              title="Copy Proxy"
              onClick={() => {
                const portPart = form.proxy_port ? `:${form.proxy_port}` : '';
                const authPart = form.proxy_username ? `${form.proxy_username}:${form.proxy_password}@` : '';
                navigator.clipboard.writeText(`${form.proxy_type || 'http'}://${authPart}${form.proxy_host || ''}${portPart}`);
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:bg-transparent rounded-lg border-0 shadow-none"
              onClick={handleClearProxy}
              disabled={!form.proxy_host}
              title={t('editor.proxy.clearProxy')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {proxyCheck && (
            <div className={`flex items-center gap-2 text-sm px-1 ${proxyCheck.ok ? 'text-green-600' : 'text-red-500'}`}>
              {proxyCheck.ok ? (
                <>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {proxyCheck.ip} — {proxyCheck.city}, {proxyCheck.country} ({proxyCheck.org})
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{proxyCheck.error || t('editor.proxy.connectionError')}</span>
                </>
              )}
            </div>
          )}
        </div>
      </FormRow>

      <FormRow label={t('editor.proxy.auth', 'Auth')}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            autoComplete="new-password"
            value={form.proxy_username || ''}
            onChange={(e) => updateField('proxy_username', e.target.value)}
            placeholder={t('editor.proxy.proxyUsername', 'Proxy Username')}
            className="w-full"
          />
          <Input
            type="password"
            autoComplete="new-password"
            value={form.proxy_password || ''}
            onChange={(e) => updateField('proxy_password', e.target.value)}
            placeholder={t('editor.proxy.proxyPassword', 'Proxy Password')}
            className="w-full"
          />
        </div>
      </FormRow>

      {/* <FormRow label={t('editor.proxy.resetUrl', 'Reset URL')}>
        <div className="relative w-full">
          <Input value={form.proxy_reset_url || ''} onChange={(e) => updateField('proxy_reset_url', e.target.value)} placeholder={t('editor.proxy.resetUrlPlaceholder')} className="pr-10" />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:bg-primary/10">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </FormRow> */}
    </div>
  );
}
