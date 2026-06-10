import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function StartupArgsInput({ value, onChange }: { value: string[]; onChange: (val: string[]) => void }) {
  const { t } = useTranslation("profiles");
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addArg = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    // Normalise: prepend -- if missing and user didn't type a bare word intentionally
    const flag = trimmed.startsWith('-') ? trimmed : `--${trimmed}`;
    if (!value.includes(flag)) {
      onChange([...value, flag]);
    }
    setInputValue('');
  };

  const removeArg = (arg: string) => {
    onChange(value.filter((a) => a !== arg));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) addArg(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  // Colour coding for known safe vs. warn flags
  const warnFlags = new Set(['--no-sandbox', '--disable-web-security', '--allow-running-insecure-content']);
  const chipColor = (flag: string) =>
    warnFlags.has(flag)
      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50'
      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-border/40';

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 w-full min-h-[42px] p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] transition-shadow cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((arg) => (
        <span key={arg} className={`flex items-center gap-1 border px-2 py-0.5 rounded-md text-xs font-mono font-medium ${chipColor(arg)}`}>
          <Zap className="w-2.5 h-2.5 opacity-60 shrink-0" />
          {arg}
          <Button
            variant="link"
            size="icon"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeArg(arg);
            }}
            className="w-auto h-auto p-0 ml-0.5 hover:text-red-500 focus:outline-none text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addArg(inputValue);
        }}
        className="flex-1 min-w-[200px] bg-transparent outline-none border-none shadow-none placeholder:text-slate-400 py-0.5 px-1 focus:outline-none focus:ring-0 text-sm font-mono"
        placeholder={value.length === 0 ? t('editor.advanced.startupArgsPlaceholder', '--flag-name or --key=value (Enter to add)') : ''}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}
