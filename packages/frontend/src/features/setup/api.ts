import { request } from '@/lib/request';

export type DatabaseSetupStatus = {
  configured: boolean;
  required?: boolean;
  source?: string;
  client?: 'sqlite' | 'postgres';
  filename?: string;
  connection?: string;
  recommended?: {
    client: 'auto';
    label: string;
    description: string;
    sqliteFile: string;
  };
  options?: Array<'auto' | 'sqlite' | 'postgres'>;
};

export type SetupStatusResponse = {
  ok: boolean;
  database: DatabaseSetupStatus;
};

export type ConfigureDatabasePayload =
  | { client: 'auto' }
  | { client: 'sqlite'; filename: string }
  | { client: 'postgres'; connection: string };

export function fetchSetupStatus() {
  return request<SetupStatusResponse>('/setup/status');
}

export function configureDatabase(payload: ConfigureDatabasePayload) {
  return request<{ ok: boolean; restartRequired: boolean; setup: DatabaseSetupStatus }>('/setup/configure', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
