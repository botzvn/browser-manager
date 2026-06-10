import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TabButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`px-2 py-2 text-sm font-semibold transition-colors border-0 border-b-2 rounded-none -mb-px hover:bg-transparent ${
        active ? 'text-primary border-primary' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-slate-300'
      }`}
    >
      {children}
    </Button>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="h-px bg-border/50 w-full relative">
      <div className="absolute -top-3 left-8 bg-[#FAFAFA] dark:bg-slate-900/40 px-2 text-sm font-medium text-slate-400">{label}</div>
    </div>
  );
}

export function SegmentedControl({
  options,
  active,
  onChange,
}: {
  options: (string | { label: React.ReactNode; value: string })[];
  active: string;
  onChange?: (val: string) => void;
}) {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-max shadow-inner">
      {options.map((opt) => {
        const isObj = typeof opt === 'object';
        const val = isObj ? opt.value : opt;
        const label = isObj ? opt.label : opt;
        return (
          <Button
            variant="ghost"
            size="sm"
            key={val}
            onClick={() => onChange?.(val)}
            className={`px-4 py-1.5 h-auto text-sm font-medium transition-all hover:bg-transparent ${
              active === val
                ? 'bg-white dark:bg-slate-700 shadow-sm rounded-lg text-primary hover:bg-white dark:hover:bg-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export function Toggle({ active }: { active?: boolean }) {
  return (
    <div className={`w-10 h-5 rounded-full relative shrink-0 transition-colors shadow-inner ${active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );
}

export function ToggleRow({ label, active, onChange }: { label: string; active?: boolean; onChange?: (val: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange?.(!active)}>
      <Toggle active={active} />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}

export function DisabledToggleRow({ label, badge, tooltip }: { label: string; badge?: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-2 cursor-not-allowed opacity-60" title={tooltip}>
      {/* Locked toggle — visually off, non-interactive */}
      <div className="w-10 h-5 rounded-full relative shrink-0 bg-slate-200 dark:bg-slate-700 shadow-inner">
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform translate-x-0" />
      </div>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {badge && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/40 leading-none select-none ml-0.5">
          <Lock className="w-2.5 h-2.5 shrink-0" />
          {badge}
        </span>
      )}
    </div>
  );
}

export function FormRow({ label, children, overflowVisible }: { label: React.ReactNode; children: React.ReactNode; overflowVisible?: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
      <div className="md:w-32 md:text-right pt-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">{label}</div>
      <div className={`flex-1 max-w-2xl ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}>{children}</div>
    </div>
  );
}

export function OsButton({ icon, label, active, onClick, proOnly }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; proOnly?: boolean }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      type="button"
      className={`relative flex items-center gap-2 px-3 py-5 rounded-lg border-0 transition-all duration-150 focus:outline-none focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] ${
        proOnly
          ? 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:text-slate-400'
          : active
            ? 'bg-primary/5 text-primary font-medium shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] hover:bg-primary/5 hover:text-primary'
            : 'bg-white dark:bg-slate-800 text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {proOnly && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold leading-none bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm tracking-wide">
          PRO
        </span>
      )}
    </Button>
  );
}

export function OverviewRow({ label, value, multiLine }: { label: string; value: string; multiLine?: boolean }) {
  return (
    <div className={`flex ${multiLine ? 'flex-col gap-1' : 'justify-between items-start gap-4'}`}>
      <div className="text-slate-400 shrink-0 min-w-32">{label}</div>
      <div className={`text-slate-700 dark:text-slate-200 font-medium ${multiLine ? 'text-left' : 'text-right break-words'}`}>{value}</div>
    </div>
  );
}
