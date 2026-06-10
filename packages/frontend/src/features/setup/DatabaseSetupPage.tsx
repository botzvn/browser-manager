import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Database, HardDrive, Loader2, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { configureDatabase, type DatabaseSetupStatus } from './api';

type SetupMode = 'auto' | 'sqlite' | 'postgres';

type DatabaseSetupPageProps = {
  status: DatabaseSetupStatus;
  onConfigured: () => void;
};

export function DatabaseSetupPage({ status, onConfigured }: DatabaseSetupPageProps) {
  const [mode, setMode] = useState<SetupMode>('auto');
  const [sqliteFile, setSqliteFile] = useState(status.recommended?.sqliteFile || status.filename || '/data/botzvn-manager.db');
  const [connection, setConnection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (mode === 'postgres') return connection.trim().startsWith('postgres://') || connection.trim().startsWith('postgresql://');
    if (mode === 'sqlite') return sqliteFile.trim().length > 0;
    return true;
  }, [connection, mode, sqliteFile]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      if (mode === 'auto') await configureDatabase({ client: 'auto' });
      if (mode === 'sqlite') await configureDatabase({ client: 'sqlite', filename: sqliteFile.trim() });
      if (mode === 'postgres') await configureDatabase({ client: 'postgres', connection: connection.trim() });
      onConfigured();
    } catch (err: any) {
      setError(err?.message || 'Database setup failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-brand-gradient text-slate-900 dark:text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur border border-slate-200/70 dark:border-slate-700/70 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Database setup</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose storage before using BotZVN Manager.</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SetupOption
              active={mode === 'auto'}
              icon={Check}
              title="Auto"
              description="SQLite in the data volume."
              onClick={() => setMode('auto')}
            />
            <SetupOption
              active={mode === 'sqlite'}
              icon={HardDrive}
              title="SQLite"
              description="Custom local DB path."
              onClick={() => setMode('sqlite')}
            />
            <SetupOption
              active={mode === 'postgres'}
              icon={Server}
              title="PostgreSQL"
              description="External shared database."
              onClick={() => setMode('postgres')}
            />
          </div>

          {mode === 'sqlite' && (
            <Field label="SQLite file">
              <Input value={sqliteFile} onChange={(event) => setSqliteFile(event.target.value)} placeholder="/data/botzvn-manager.db" />
            </Field>
          )}

          {mode === 'postgres' && (
            <Field label="PostgreSQL connection string">
              <Input
                value={connection}
                onChange={(event) => setConnection(event.target.value)}
                placeholder="postgresql://user:password@host:5432/database"
              />
            </Field>
          )}

          {error && <div className="rounded-lg bg-red-50 text-red-700 border border-red-100 px-3 py-2 text-sm">{error}</div>}

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'auto' ? status.recommended?.sqliteFile || '/data/botzvn-manager.db' : 'Database will be initialized immediately.'}
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSaving} className="min-w-32">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SetupOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-4 transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary/50'
      }`}
    >
      <Icon className="h-5 w-5 mb-3" />
      <div className="font-semibold">{title}</div>
      <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">{description}</div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
