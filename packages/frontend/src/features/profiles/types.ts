export interface ProfileData {
  id: string;
  name: string;
  os: string;
  browser_type: string;
  proxy_type: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  proxy_reset_url: string | null;
  platform_url: string | null;
  platform_tabs: string | null;
  platform_username: string | null;
  platform_password: string | null;
  platform_2fa: string | null;
  fingerprint: Record<string, unknown>;
  cookies: unknown[];
  startup_args?: string[];
  notes: string;
  tags: string;
  status: 'running' | 'stopped';
  wsEndpoint?: string;
  updated_at: string;
  user_agent?: string;
  group_id?: string;
  group_name?: string;
  group_color?: string;
}

export interface FingerprintHardwareOptions {
  canvas?: boolean;
  webgl?: boolean;
  audioContext?: boolean;
  mediaDevices?: boolean;
  clientRects?: boolean;
  speechVoices?: boolean;
  networkInfo?: boolean;
}

export interface FingerprintOptions {
  webrtc?: string;
  webrtc_ip?: string;
  timezone?: string;
  location?: string;
  language?: string;
  custom_language?: string;
  display_language?: string;
  custom_display_language?: string;
  resolution?: string;
  custom_resolution?: string;
  fonts?: string;
  custom_fonts?: string;
  hardware?: FingerprintHardwareOptions;
}

export interface CreateProfilePayload {
  name: string;
  os?: string;
  browser_type?: string;
  proxy_type?: string;
  proxy_host?: string;
  proxy_port?: number;
  proxy_username?: string;
  proxy_password?: string;
  proxy_reset_url?: string;
  platform_url?: string;
  platform_tabs?: string;
  platform_username?: string;
  platform_password?: string;
  platform_2fa?: string;
  fingerprint?: Record<string, unknown>;
  cookies?: unknown[];
  startup_args?: string[];
  notes?: string;
  tags?: string;
  user_agent?: string;
  group_id?: string;
  device_memory?: number;
  hardware_concurrency?: number;
  fingerprint_options?: Omit<FingerprintOptions, 'custom_language' | 'display_language' | 'custom_display_language' | 'resolution' | 'custom_resolution' | 'fonts' | 'custom_fonts'>;
}

export type ProfileForm = Omit<CreateProfilePayload, 'fingerprint_options'> & {
  ua_os?: string;
  ua_version?: string;
  ua_full_version?: string;
  fingerprint_options?: FingerprintOptions;
  startup_args?: string[];
};

export interface ProxyCheckResult {
  ok: boolean;
  ip?: string;
  country?: string;
  city?: string;
  org?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  languages?: string;
  error?: string;
}

export type WebglOption = {
  id?: number;
  renderer: string;
  vendor: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  label?: string;
  tier?: 'free' | 'vip' | 'premium';
};

export type WebglOptionsResponse = {
  tier: 'free' | 'vip' | 'premium';
  platform?: string;
  options: WebglOption[];
  lockedCount?: number;
  totalCount: number;
};

export interface ProfileFormMappingResult {
  form: ProfileForm;
  cookieText: string;
  storedUnmaskedRenderer: string;
}
