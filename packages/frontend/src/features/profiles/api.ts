import { request } from '@/lib/request';
import type { ExtensionData } from '../../extensions/api';
import type { CreateProfilePayload, ProfileData, ProxyCheckResult } from './types';

export type { CreateProfilePayload, ProfileData } from './types';

type ManagerProfile = {
  id: string;
  name: string;
  os?: string;
  browser_type?: string;
  proxy_type?: string | null;
  proxy_host?: string | null;
  proxy_port?: number | null;
  proxy_username?: string | null;
  proxy_password?: string | null;
  proxy_reset_url?: string | null;
  platform_url?: string | null;
  platform_tabs?: string | null;
  platform_username?: string | null;
  platform_password?: string | null;
  platform_2fa?: string | null;
  fingerprint?: Record<string, any>;
  cookies?: any[];
  startup_args?: string[];
  notes?: string;
  tags?: string;
  status?: 'running' | 'stopped';
  user_agent?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  group_color?: string | null;
  url?: string;
  screen?: { width: number; height: number };
  proxy?: unknown;
  launchArgs?: string[];
  createdAt?: string;
  updatedAt?: string;
  runtime?: {
    status: 'running' | 'stopped';
    display?: string;
    cdpPort?: number;
    cdpUrl?: string;
    viewer?: { active: boolean; wsPath?: string; viewerCount?: number };
  };
};

type ProfilesResponse =
  | ManagerProfile[]
  | {
      profiles?: ManagerProfile[];
      data?: ManagerProfile[];
      total?: number;
      pagination?: { total?: number };
    };

function toProfileData(profile: ManagerProfile): ProfileData {
  const proxy = typeof profile.proxy === 'object' && profile.proxy ? (profile.proxy as Record<string, any>) : {};
  return {
    id: profile.id,
    name: profile.name,
    os: profile.os || 'linux',
    browser_type: profile.browser_type || 'botzvn',
    proxy_type: profile.proxy_type ?? proxy.type ?? null,
    proxy_host: profile.proxy_host ?? proxy.host ?? null,
    proxy_port: profile.proxy_port ?? proxy.port ?? null,
    proxy_username: profile.proxy_username ?? proxy.username ?? null,
    proxy_password: profile.proxy_password ?? proxy.password ?? null,
    proxy_reset_url: profile.proxy_reset_url ?? null,
    platform_url: profile.platform_url ?? profile.url ?? null,
    platform_tabs: profile.platform_tabs ?? null,
    platform_username: profile.platform_username ?? null,
    platform_password: profile.platform_password ?? null,
    platform_2fa: profile.platform_2fa ?? null,
    fingerprint: {
      ...(profile.fingerprint || {}),
      screen: profile.screen ?? profile.fingerprint?.screen,
      display: profile.runtime?.display,
      cdpPort: profile.runtime?.cdpPort,
      viewer: profile.runtime?.viewer,
    },
    cookies: profile.cookies ?? [],
    startup_args: profile.startup_args ?? profile.launchArgs ?? [],
    notes: profile.notes || (profile.runtime?.display ? `DISPLAY ${profile.runtime.display}` : ''),
    tags: profile.tags || (profile.runtime?.viewer?.active ? 'viewer' : ''),
    status: profile.runtime?.status === 'running' || profile.status === 'running' ? 'running' : 'stopped',
    wsEndpoint: profile.runtime?.cdpUrl,
    updated_at: profile.updatedAt ?? profile.createdAt ?? new Date().toISOString(),
    group_id: profile.group_id ?? undefined,
    group_name: profile.group_name || 'All',
    group_color: profile.group_color || '#1c92d2',
    user_agent: profile.user_agent ?? undefined,
  };
}

function toManagerPayload(payload: Partial<CreateProfilePayload>) {
  const fingerprint = payload.fingerprint as Record<string, any> | undefined;
  const screen = fingerprint?.screen as { width?: number; height?: number } | undefined;
  return {
    name: payload.name,
    os: payload.os,
    browser_type: payload.browser_type,
    proxy_type: payload.proxy_type,
    proxy_host: payload.proxy_host,
    proxy_port: payload.proxy_port,
    proxy_username: payload.proxy_username,
    proxy_password: payload.proxy_password,
    proxy_reset_url: payload.proxy_reset_url,
    url: payload.platform_url || undefined,
    platform_url: payload.platform_url || undefined,
    platform_tabs: payload.platform_tabs,
    platform_username: payload.platform_username,
    platform_password: payload.platform_password,
    platform_2fa: payload.platform_2fa,
    fingerprint,
    cookies: payload.cookies,
    notes: payload.notes,
    tags: payload.tags,
    group_id: payload.group_id,
    screen,
    launchArgs: payload.startup_args ?? [],
    startup_args: payload.startup_args ?? [],
  };
}

export async function fetchProfiles(search?: string, groupId?: string) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  if (groupId && groupId !== 'all') params.set('group_id', groupId);
  const response = await request<ProfilesResponse>(`/profiles${params.size ? `?${params.toString()}` : ''}`);
  const raw = Array.isArray(response) ? response : response.profiles || response.data || [];
  const profiles = raw.map(toProfileData);
  const q = search?.trim().toLowerCase();
  const filtered = q ? profiles.filter((p) => [p.name, p.id, p.platform_url, p.notes, p.tags].join(' ').toLowerCase().includes(q)) : profiles;
  const grouped = groupId && groupId !== 'all' ? filtered.filter((p) => p.group_id === groupId) : filtered;
  const total = Array.isArray(response) ? grouped.length : (response.total ?? response.pagination?.total ?? grouped.length);
  return { profiles: grouped, total };
}

export async function getProfile(id: string) {
  return toProfileData(await request<ManagerProfile>(`/profiles/${id}`));
}

export async function createProfile(payload: CreateProfilePayload) {
  return toProfileData(
    await request<ManagerProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(toManagerPayload(payload)),
    })
  );
}

export async function updateProfile(id: string, payload: Partial<CreateProfilePayload>) {
  return toProfileData(
    await request<ManagerProfile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toManagerPayload(payload)),
    })
  );
}

export async function deleteProfile(id: string) {
  await request<{ ok: boolean }>(`/profiles/${id}`, { method: 'DELETE' });
  return { message: 'Profile deleted' };
}

export async function fetchTrashProfiles() {
  const response = await request<ProfilesResponse>('/profiles/trash');
  const raw = Array.isArray(response) ? response : response.profiles || response.data || [];
  return { profiles: raw.map(toProfileData), total: Array.isArray(response) ? raw.length : (response.total ?? raw.length) };
}

export async function restoreProfile(id: string) {
  await request<{ ok: boolean }>(`/profiles/${id}/restore`, { method: 'POST' });
  return { message: 'Profile restored', id };
}

export async function forceDeleteProfile(id: string) {
  await request<{ ok: boolean }>(`/profiles/${id}/force`, { method: 'DELETE' });
  return { message: 'Profile deleted permanently' };
}

export async function fetchAllTags(): Promise<string[]> {
  return request<string[]>('/profiles/tags');
}

export async function startProfile(id: string) {
  const runtime = await request<{ cdpUrl?: string; cdpPort?: number }>(`/profiles/${id}/start`, { method: 'POST' });
  return {
    message: 'Browser launched',
    pid: -1,
    wsEndpoint: runtime.cdpUrl || (runtime.cdpPort ? `/api/profiles/${id}/cdp` : ''),
  };
}

export async function stopProfile(id: string) {
  await request<{ ok: boolean }>(`/profiles/${id}/stop`, { method: 'POST' });
  return { message: 'Browser stopped' };
}

export async function getProfileStatus(id: string) {
  const runtime = await request<ManagerProfile['runtime']>(`/profiles/${id}/status`);
  return {
    status: runtime?.status === 'running' ? 'running' : 'stopped',
    pid: -1,
    wsEndpoint: runtime?.cdpUrl,
  };
}


export async function checkProxy(params?: {
  proxy_type?: string;
  proxy_host: string;
  proxy_port: number;
  proxy_username?: string;
  proxy_password?: string;
}): Promise<ProxyCheckResult> {
  if (!params || !params.proxy_host || !params.proxy_port) {
    return { ok: false, error: 'Missing proxy host or port' };
  }
  try {
    return await request<ProxyCheckResult>('/proxy/check', {
      method: 'POST',
      body: JSON.stringify({
        proxy_type: params.proxy_type || 'http',
        proxy_host: params.proxy_host,
        proxy_port: params.proxy_port,
        proxy_username: params.proxy_username || '',
        proxy_password: params.proxy_password || '',
      }),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function startProfileViewer(id: string) {
  return request<{ wsPath: string }>(`/profiles/${id}/view/start`, { method: 'POST' });
}

export async function stopProfileViewer(id: string) {
  return request<{ ok: boolean }>(`/profiles/${id}/view/stop`, { method: 'POST' });
}

export async function getProfileExtensions(_profileId: string): Promise<ExtensionData[]> {
  return [];
}

export async function setProfileExtensions(_profileId: string, _extensionIds: string[]): Promise<ExtensionData[]> {
  return [];
}

export async function removeProfileExtension() {
  return undefined;
}
