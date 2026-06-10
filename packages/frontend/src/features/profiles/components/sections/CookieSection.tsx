import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, ClipboardPaste, Cookie, Copy, FileText, Trash2, XCircle } from 'lucide-react';
import { SectionDivider, FormRow } from '../FormLayoutUtils';

export interface CookieSectionProps {
  cookieText: string;
  setCookieText: (text: string) => void;
  cookieValidationError: string | null;
  setCookieValidationError: (err: string | null) => void;
  isEditing: boolean;
  originalCookieText: string;
  selectedCopyDomain: string | null;
  setSelectedCopyDomain: (domain: string | null) => void;
  copiedDomain: string | null;
  setCopiedDomain: (domain: string | null) => void;
  t: ReturnType<typeof useTranslation>['t'];
}

export function CookieSection({
  cookieText,
  setCookieText,
  cookieValidationError,
  setCookieValidationError,
  isEditing,
  originalCookieText,
  selectedCopyDomain,
  setSelectedCopyDomain,
  copiedDomain,
  setCopiedDomain,
  t,
}: CookieSectionProps) {
  let count = 0;
  let domains: string[] = [];
  let parsedCookies: any[] = [];
  if (cookieText.trim()) {
    try {
      const p = JSON.parse(cookieText);
      if (Array.isArray(p)) {
        parsedCookies = p;
        count = p.length;
        domains = [...new Set(p.map((c: any) => c.domain || '').filter(Boolean))] as string[];
      }
    } catch {
      /* ignore */
    }
  }

  const handleCopyDomain = async (domain: string) => {
    const filtered = parsedCookies.filter((c: any) => c.domain === domain);
    await navigator.clipboard.writeText(JSON.stringify(filtered, null, 2));
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  return (
    <div id="section-cookie" className="space-y-8 py-8">
      <SectionDivider label="Cookie" />

      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          {isEditing && originalCookieText && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {t('editor.cookie.syncedFromBrowser', 'Đã sync từ browser')}
            </div>
          )}

          {count > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              {count} {t('editor.cookie.cookiesLoaded', 'cookie đã tải')}
            </div>
          )}

          {domains.map((d) => (
            <button
              key={d}
              type="button"
              title={t('editor.cookie.clickToCopyCookies', 'Click để copy cookies của {{domain}}', { domain: d })}
              onClick={() => setSelectedCopyDomain(selectedCopyDomain === d ? null : d)}
              className={`text-xs px-2.5 py-1 rounded-full font-mono transition-all ${
                selectedCopyDomain === d
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary border border-transparent'
              }`}
            >
              {d}
            </button>
          ))}

          {domains.length > 3 && !selectedCopyDomain && <span className="text-xs text-slate-400">{domains.length} {t('editor.cookie.clickToCopyDomain', 'domain — click để copy từng domain')}</span>}
        </div>

        {selectedCopyDomain && (() => {
          const domainCookies = parsedCookies.filter((c: any) => c.domain === selectedCopyDomain);
          return (
            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border border-border/50 rounded-lg px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2 min-w-0">
                <Cookie className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-600 dark:text-slate-300 text-xs truncate">{selectedCopyDomain}</span>
                <span className="text-xs text-slate-400 shrink-0">
                  {domainCookies.length} cookie{domainCookies.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyDomain(selectedCopyDomain)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  {copiedDomain === selectedCopyDomain ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> {t('editor.cookie.copied', 'Đã copy!')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy JSON
                    </>
                  )}
                </button>
                <button type="button" onClick={() => setSelectedCopyDomain(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <FormRow label={t('editor.cookie.cookieData', 'Dữ liệu Cookie')}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setCookieText(text);
                  setCookieValidationError(null);
                  try {
                    JSON.parse(text);
                  } catch {
                    setCookieValidationError(t('editor.cookie.invalidJsonFormat', 'JSON không hợp lệ — kiểm tra lại định dạng'));
                  }
                } catch {
                  /* permission denied */
                }
              }}
              className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-medium bg-white dark:bg-slate-800 border border-border/60 px-3 py-1.5 rounded-lg shadow-sm hover:border-primary/50"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              {t('editor.cookie.pasteFromClipboard', 'Dán từ clipboard')}
            </button>
            <button
              type="button"
              onClick={() => {
                setCookieText('');
                setCookieValidationError(null);
              }}
              disabled={!cookieText}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors font-medium bg-white dark:bg-slate-800 border border-border/60 px-3 py-1.5 rounded-lg shadow-sm hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('editor.cookie.clear', 'Xóa')}
            </button>
            {cookieText && (
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(cookieText);
                    setCookieText(JSON.stringify(parsed, null, 2));
                    setCookieValidationError(null);
                  } catch {
                    setCookieValidationError(t('editor.cookie.invalidJsonFormatShort', 'JSON không hợp lệ — không thể format'));
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 transition-colors font-medium bg-white dark:bg-slate-800 border border-border/60 px-3 py-1.5 rounded-lg shadow-sm hover:border-blue-300"
              >
                <FileText className="w-3.5 h-3.5" />
                Format JSON
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              className={`flex w-full rounded-lg bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus:outline-none transition-shadow min-h-[200px] resize-y font-mono text-slate-600 dark:text-slate-300 placeholder:font-sans ${
                cookieValidationError
                  ? 'shadow-[0_4px_12px_rgba(239,68,68,0.08),inset_0_0_0_1.5px_rgb(239,68,68)]'
                  : 'focus:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)]'
              }`}
              value={cookieText}
              onChange={(e) => {
                setCookieText(e.target.value);
                if (!e.target.value.trim()) {
                  setCookieValidationError(null);
                  return;
                }
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (!Array.isArray(parsed)) {
                    setCookieValidationError(t('editor.cookie.invalidFormat', 'Dữ liệu phải là một mảng JSON ([...])'));
                  } else {
                    setCookieValidationError(null);
                  }
                } catch (err: any) {
                  setCookieValidationError(t('editor.cookie.invalidJsonError', 'JSON không hợp lệ: {{error}}', { error: err.message }));
                }
              }}
              placeholder={'[\n  {\n    "name": "session_id",\n    "value": "abc123",\n    "domain": ".example.com",\n    "path": "/",\n    "httpOnly": true,\n    "secure": true\n  }\n]'}
            />
          </div>
          {cookieValidationError && (
            <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{cookieValidationError}</span>
            </div>
          )}
          {isEditing && originalCookieText && cookieText !== originalCookieText && !cookieValidationError && (
            <div className="flex items-center justify-between gap-3 text-xs text-amber-600/80 dark:text-amber-400/70 py-1">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {t('editor.cookie.overwriteWarning', 'Cookie mới sẽ ghi đè dữ liệu đã sync từ browser sau khi lưu.')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCookieText(originalCookieText);
                  setCookieValidationError(null);
                }}
                className="shrink-0 underline underline-offset-2 decoration-dotted hover:text-amber-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                {t('editor.cookie.restoreSync', 'Khôi phục cookie sync')}
              </button>
            </div>
          )}
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-medium text-slate-500">{t('editor.cookie.format', 'Định dạng:')}</span> {t('editor.cookie.formatDesc1', 'Mảng JSON chứa các object cookie. Mỗi cookie cần có ít nhất')}{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">name</code>,{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">value</code>,{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">domain</code>. {t('editor.cookie.formatDesc2', 'Cookie được inject vào browser khi khởi động và tự động sync 2 chiều.')}
          </div>
        </div>
      </FormRow>
    </div>
  );
}
