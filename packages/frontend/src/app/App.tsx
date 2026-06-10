import { useEffect, useState } from 'react';

import { DatabaseSetupPage } from '../features/setup/DatabaseSetupPage';
import { fetchSetupStatus, type DatabaseSetupStatus } from '../features/setup/api';

import { AppRouter } from './router';

export function App() {
  const [database, setDatabase] = useState<DatabaseSetupStatus | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const refreshSetup = async () => {
    try {
      const response = await fetchSetupStatus();
      setDatabase(response.database);
      setSetupError(null);
    } catch (err: any) {
      setSetupError(err?.message || 'Cannot load setup status');
    }
  };

  useEffect(() => {
    refreshSetup();
  }, []);

  if (setupError) {
    return (
      <div className="h-screen w-screen bg-brand-gradient flex items-center justify-center text-sm text-red-700">
        <div className="rounded-lg bg-white border border-red-100 shadow px-4 py-3">{setupError}</div>
      </div>
    );
  }

  if (!database) {
    return <div className="h-screen w-screen bg-brand-gradient flex items-center justify-center text-slate-500 text-sm">Loading...</div>;
  }

  if (!database.configured) {
    return <DatabaseSetupPage status={database} onConfigured={refreshSetup} />;
  }

  return <AppRouter />;
}

export default App;
