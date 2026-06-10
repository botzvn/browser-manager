import type { CreateProfilePayload, ProfileData, ProfileForm, ProfileFormMappingResult, ProxyCheckResult, WebglOption } from './types';
import { UA_VERSIONS, UA_FULL_VERSIONS, UA_OS_STRINGS } from './constants';

type StoredWebrtc = {
  policy?: string;
  fillIp?: string;
};

type StoredFingerprint = Record<string, unknown> & {
  full_version?: string;  // legacy root-level, should not exist anymore
  client_hints?: {
    full_version?: string;
    platform?: string;
    platform_version?: string;
    architecture?: string;
    bitness?: string;
    mobile?: boolean;
    wow64?: boolean;
    model?: string;
  };
  webgl_unmasked_renderer?: string;
  hardware_concurrency?: number | string;
  device_memory?: number | string;
  webrtc?: StoredWebrtc;
  canvas?: unknown;
  audio?: unknown;
  client_rects?: unknown;
  networkInfo?: unknown;
  webgl?: {
    renderer?: string;
    unmaskedRenderer?: string;
  };
  navigator?: {
    hardwareConcurrency?: number | string;
    deviceMemory?: number | string;
  };
  screen?: {
    width?: number;
    height?: number;
  };
  _resolutionMode?: string;
};

export function osToUAKey(os: string): string {
  if (os === 'mac' || os === 'mac_apple_silicon') return 'mac';
  if (os === 'linux') return 'linux';
  if (os === 'android') return 'android';
  return 'win';
}

export function generateUA(os: string, ver: string): string {
  const uaKey = osToUAKey(os);
  const osStr = UA_OS_STRINGS[uaKey] || UA_OS_STRINGS.win;
  const mobile = uaKey === 'android' ? 'Mobile ' : '';
  return `Mozilla/5.0 (${osStr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 ${mobile}Safari/537.36`;
}

export function detectDefaultOS(): string {
  if (typeof navigator === 'undefined') return 'windows';
  if (navigator.userAgent.includes('Mac')) return 'mac_apple_silicon';
  if (navigator.userAgent.includes('Win')) return 'windows';
  if (navigator.userAgent.includes('Linux')) return 'linux';
  return 'windows';
}

export function getDefaultHardware(os: string): { concurrency: number; memory: number } {
  if (os === 'mac_apple_silicon') return { concurrency: 8, memory: 8 };
  if (os === 'mac') return { concurrency: 4, memory: 8 };
  if (os === 'windows' || os === 'linux') return { concurrency: 8, memory: 8 };
  if (os === 'android' || os === 'ios') return { concurrency: 4, memory: 6 };
  return { concurrency: 8, memory: 8 };
}

export function getDefaultProfileForm(): ProfileForm {
  const defaultOs = detectDefaultOS();
  return {
    name: '',
    os: defaultOs,
    browser_type: 'chrome',
    proxy_type: 'http',
    proxy_host: '',
    proxy_port: undefined,
    proxy_username: '',
    proxy_password: '',
    proxy_reset_url: '',
    ua_version: '146',
    ua_full_version: UA_FULL_VERSIONS['146'][0],
    platform_url: '',
    platform_tabs: '',
    platform_username: '',
    platform_password: '',
    platform_2fa: '',
    cookies: [],
    notes: '',
    tags: '',
    group_id: '',
    user_agent: generateUA(defaultOs, '146'),
    fingerprint_options: {
      webrtc: 'Disable UDP',
      webrtc_ip: '',
      timezone: 'based_on_ip',
      location: 'based_on_ip',
      language: 'based_on_ip',
      resolution: 'auto_fit',
      hardware: {
        canvas: false,
        webgl: false,
        audioContext: false,
        mediaDevices: false,
        clientRects: false,
        speechVoices: false,
        networkInfo: false,
      },
    },
    device_memory: getDefaultHardware(defaultOs).memory,
    hardware_concurrency: getDefaultHardware(defaultOs).concurrency,
    startup_args: [],
  };
}

function mapStoredWebrtcToForm(storedWebrtc?: StoredWebrtc): { webrtcLabel: string; webrtcIp: string } {
  let webrtcLabel = 'Disable UDP';
  let webrtcIp = '';

  if (storedWebrtc?.policy) {
    const webrtcPolicyMap: Record<string, string> = {
      disable_non_proxied_udp: 'Disable UDP',
      disable: 'Off',
      altered: 'Altered',
      public: 'Real',
      manual: 'Manual',
    };
    webrtcLabel = webrtcPolicyMap[storedWebrtc.policy] || 'Disable UDP';
    webrtcIp = storedWebrtc.fillIp || '';
  }

  return { webrtcLabel, webrtcIp };
}

export function mapProfileToForm(profile: ProfileData): ProfileFormMappingResult {
  const storedFingerprint = (profile.fingerprint || {}) as StoredFingerprint;
  const cookies = Array.isArray(profile.cookies) ? profile.cookies : [];
  const uaMatch = (profile.user_agent || '').match(/Chrome\/(\d+)/);
  const uaVersion = uaMatch ? uaMatch[1] : '146';
  // Read full_version from correct location: client_hints.full_version
  // Fall back to legacy root-level full_version for old profiles, then to frontend defaults
  const storedFull = storedFingerprint.client_hints?.full_version || storedFingerprint.full_version;
  const uaFullVersion = storedFull && storedFull.startsWith(`${uaVersion}.`) ? storedFull : (UA_FULL_VERSIONS[uaVersion]?.[0] ?? '');

  const extWebgl = storedFingerprint.webgl || {};
  const storedUnmaskedRenderer = extWebgl.unmaskedRenderer || extWebgl.renderer || storedFingerprint.webgl_unmasked_renderer || '';
  const { webrtcLabel, webrtcIp } = mapStoredWebrtcToForm(storedFingerprint.webrtc);
  const extHwConcurr = storedFingerprint.navigator?.hardwareConcurrency || storedFingerprint.hardware_concurrency;
  const extDeviceMem = storedFingerprint.navigator?.deviceMemory || storedFingerprint.device_memory;

  let resolutionMode: 'default' | 'auto_fit' | 'custom' = 'default';
  let customResolution: string | undefined = undefined;

  if (storedFingerprint.screen?.width && storedFingerprint.screen?.height) {
    const w = storedFingerprint.screen.width;
    const h = storedFingerprint.screen.height;
    customResolution = `${w}x${h}`;
    
    if (storedFingerprint._resolutionMode === 'custom') {
      resolutionMode = 'custom';
    } else if (storedFingerprint._resolutionMode === 'fit') {
      resolutionMode = 'auto_fit';
    } else if (storedFingerprint._resolutionMode === 'default') {
      resolutionMode = 'default';
    } else {
      // Legacy fallback if flag doesn't exist but has screen config
      const STANDARD_RES = [
        '2560x1600', '2560x1440', '1920x1080', '1728x1117', 
        '1512x982', '1440x900', '1600x900', '1536x864', 
        '1366x768', '1280x720'
      ];
      if (!STANDARD_RES.includes(customResolution)) {
        resolutionMode = 'custom';
      } else {
        resolutionMode = 'auto_fit';
      }
    }
  } else {
    // No screen object means we are using the default (no spoof) behavior
    resolutionMode = 'default';
  }

  return {
    form: {
      name: profile.name,
      os: profile.os,
      browser_type: profile.browser_type || 'chrome',
      proxy_type: profile.proxy_type || 'http',
      proxy_host: profile.proxy_host || '',
      proxy_port: profile.proxy_port || undefined,
      proxy_username: profile.proxy_username || '',
      proxy_password: profile.proxy_password || '',
      proxy_reset_url: profile.proxy_reset_url || '',
      platform_url: profile.platform_url || '',
      platform_tabs: profile.platform_tabs || '',
      platform_username: profile.platform_username || '',
      platform_password: profile.platform_password || '',
      platform_2fa: profile.platform_2fa || '',
      cookies,
      notes: profile.notes || '',
      tags: profile.tags || '',
      group_id: profile.group_id || '',
      user_agent: profile.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ua_version: uaVersion,
      ua_full_version: uaFullVersion,
      fingerprint_options: {
        webrtc: webrtcLabel,
        webrtc_ip: webrtcIp,
        timezone: 'based_on_ip',
        location: 'based_on_ip',
        language: 'based_on_ip',
        hardware: {
          canvas: !!storedFingerprint.canvas,
          webgl: false,
          audioContext: !!storedFingerprint.audio,
          mediaDevices: false,
          clientRects: !!storedFingerprint.client_rects,
          speechVoices: false,
          networkInfo: !!storedFingerprint.networkInfo,
        },
        resolution: resolutionMode,
        custom_resolution: customResolution,
      },
      device_memory: extDeviceMem ? Number(extDeviceMem) : getDefaultHardware(profile.os || 'windows').memory,
      hardware_concurrency: extHwConcurr ? Number(extHwConcurr) : getDefaultHardware(profile.os || 'windows').concurrency,
      startup_args: Array.isArray(storedFingerprint.startup_args) ? (storedFingerprint.startup_args as string[]) : [],
    },
    cookieText: JSON.stringify(cookies, null, 2),
    storedUnmaskedRenderer,
  };
}

export function buildRandomizedProfileIdentity(os: string): Pick<ProfileForm, 'ua_version' | 'ua_full_version' | 'user_agent' | 'hardware_concurrency' | 'device_memory'> {
  const randomVer = UA_VERSIONS[Math.floor(Math.random() * UA_VERSIONS.length)];
  const hw = getDefaultHardware(os || 'windows');

  return {
    ua_version: randomVer,
    ua_full_version: UA_FULL_VERSIONS[randomVer]?.[0] ?? '',
    user_agent: generateUA(os, randomVer),
    hardware_concurrency: hw.concurrency,
    device_memory: hw.memory,
  };
}

export function parseCookieText(cookieText: string): unknown[] {
  if (!cookieText.trim()) return [];
  try {
    const parsed = JSON.parse(cookieText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseProxyPaste(text: string, fallbackType: string): { host: string; port?: number; username?: string; password?: string; proxy_type?: string } | null {
  const raw = text.trim();
  if (!raw) return null;

  let host = '';
  let port = '';
  let username = '';
  let password = '';
  let type = fallbackType || 'http';

  try {
    if (raw.includes('://')) {
      const url = new URL(raw);
      type = url.protocol.replace(':', '');
      host = url.hostname;
      port = url.port;
      username = decodeURIComponent(url.username);
      password = decodeURIComponent(url.password);
    } else if (raw.includes('@')) {
      const [auth, server] = raw.split('@');
      const [u, p] = auth.split(':');
      const [h, prt] = server.split(':');
      username = u;
      password = p;
      host = h;
      port = prt;
    } else {
      const parts = raw.split(':');
      if (parts.length === 4) {
        if (!Number.isNaN(Number(parts[1]))) {
          host = parts[0];
          port = parts[1];
          username = parts[2];
          password = parts[3];
        } else if (!Number.isNaN(Number(parts[3]))) {
          username = parts[0];
          password = parts[1];
          host = parts[2];
          port = parts[3];
        }
      } else if (parts.length === 2) {
        host = parts[0];
        port = parts[1];
      } else {
        return null;
      }
    }
  } catch {
    return null;
  }

  if (!host) return null;

  return {
    host,
    ...(port ? { port: parseInt(port, 10) || undefined } : {}),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(['http', 'https', 'socks5'].includes(type) ? { proxy_type: type } : {}),
  };
}

export function buildProfilePayload({
  form,
  cookieText,
  proxyCheck,
  selectedGpu,
}: {
  form: ProfileForm;
  cookieText: string;
  proxyCheck: ProxyCheckResult | null;
  selectedGpu: WebglOption | null;
}): CreateProfilePayload {
  const cookies = parseCookieText(cookieText);
  const { fingerprint_options, ua_os: _uaOs, ua_version: _uaVersion, ua_full_version, ...rest } = form;
  const fpOpts = fingerprint_options || {
    webrtc: 'Disable UDP',
    webrtc_ip: '',
    timezone: 'based_on_ip',
    location: 'based_on_ip',
    language: 'based_on_ip',
  };

  const fpOverrides: Record<string, unknown> = {};
  const webrtcConfig: Record<string, unknown> = {};

  if (fpOpts.webrtc === 'Off') webrtcConfig.policy = 'disable';
  else if (fpOpts.webrtc === 'Real' || fpOpts.webrtc === 'Chuyển tiếp') webrtcConfig.policy = 'public';
  else if (fpOpts.webrtc === 'Disable UDP' || fpOpts.webrtc === 'Cấm dùng') webrtcConfig.policy = 'disable_non_proxied_udp';
  else if (fpOpts.webrtc === 'Altered' || fpOpts.webrtc === 'Thay thế') webrtcConfig.policy = 'altered';
  else if (fpOpts.webrtc === 'Manual') {
    webrtcConfig.policy = 'manual';
    webrtcConfig.fillIp = fpOpts.webrtc_ip || '';
  } else {
    webrtcConfig.policy = 'disable_non_proxied_udp';
  }

  fpOverrides.webrtc = webrtcConfig;

  if (fpOpts.timezone === 'based_on_ip' && proxyCheck?.timezone) {
    fpOverrides.timezone = proxyCheck.timezone;
  }

  if (fpOpts.location === 'based_on_ip' && proxyCheck?.latitude && proxyCheck?.longitude) {
    fpOverrides.geolocation = {
      latitude: proxyCheck.latitude,
      longitude: proxyCheck.longitude,
      accuracy: 100,
    };
  } else if (fpOpts.location === 'block') {
    fpOverrides.geolocation = null;
  }

  if (fpOpts.language === 'based_on_ip' && proxyCheck?.languages) {
    fpOverrides.languages = proxyCheck.languages;
  } else if (fpOpts.language === 'custom' && fpOpts.custom_language) {
    fpOverrides.languages = fpOpts.custom_language;
  } else if (fpOpts.language === 'real') {
    fpOverrides.languages = 'REAL';
  }

  if (fpOpts.display_language === 'custom' && fpOpts.custom_display_language) {
    fpOverrides.display_language = fpOpts.custom_display_language;
  } else if (fpOpts.display_language === 'real') {
    fpOverrides.display_language = 'REAL';
  }

  const resolution = (!fpOpts.resolution || fpOpts.resolution === 'predefined') ? 'auto_fit' : fpOpts.resolution;

  if (resolution === 'auto_fit') {
    if (typeof window !== 'undefined' && window.screen) {
      fpOverrides.screen = {
        hostWidth: window.screen.width,
        hostHeight: window.screen.height,
      };
      fpOverrides._resolutionMode = 'fit';
    }
  } else if (resolution === 'default') {
    fpOverrides._resolutionMode = 'default';
    // Do not attach screen payload, allowing API and Chrome to fallback to real hardware bounds
  } else if (resolution === 'custom' && fpOpts.custom_resolution) {
    fpOverrides._resolutionMode = 'custom';
    const [w, h] = fpOpts.custom_resolution.split('x').map(Number);
    if (w && h) {
      const availH = h - (form.os === 'mac' ? 44 : 40);
      
      // Dynamic Chrome UI height logic matching API:
      // If code runs in a browser environment, we can check navigator.platform
      // "Mac" -> 78px, "Win" -> 87px
      let uiHeight = 87;
      if (typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')) {
        uiHeight = 78;
      }

      fpOverrides.screen = {
        width: w,
        height: h,
        availWidth: w,
        availHeight: availH,
        innerWidth: w,
        innerHeight: h - uiHeight, // outerHeight is h, minus UI offset
        outerWidth: w,
        outerHeight: h,
        devicePixelRatio: 1.0,
      };
    }
  }

  if (fpOpts.fonts === 'custom' && fpOpts.custom_fonts) {
    fpOverrides.fonts = fpOpts.custom_fonts
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  // NOTE: Do NOT set full_version at root fingerprint level.
  // Pass chrome_version as [major, fullVersion] so backend routes it correctly
  // into client_hints.full_version via generateFingerprint().
  if (ua_full_version && _uaVersion) {
    fpOverrides.chrome_version = [_uaVersion, ua_full_version];
  }

  if (fpOpts.hardware?.canvas) fpOverrides.canvas = { noise: 0.5 };
  else fpOverrides.canvas = null;

  if (fpOpts.hardware?.audioContext) fpOverrides.audio = { noise: 0.02 };
  else fpOverrides.audio = null;

  if (fpOpts.hardware?.clientRects) fpOverrides.client_rects = { height_scale: 1.05 };
  else fpOverrides.client_rects = null;
  if (fpOpts.hardware?.networkInfo) {
    fpOverrides.networkInfo = {
      downlink: parseFloat((Math.random() * 9 + 1).toFixed(1)),
      rtt: [50, 100, 150, 200, 250][Math.floor(Math.random() * 5)],
    };
  }

  if (selectedGpu) {
    fpOverrides.webgl = {
      vendor: selectedGpu.vendor,
      renderer: selectedGpu.renderer,
      unmaskedVendor: selectedGpu.unmaskedVendor,
      unmaskedRenderer: selectedGpu.unmaskedRenderer,
    };
  }

  // Inject core hardware metrics inside fingerprint so backend and Chrome generator can see and respect them
  fpOverrides.navigator = {
    hardwareConcurrency: form.hardware_concurrency,
    deviceMemory: form.device_memory,
  };

  // Startup Parameters — stored in fingerprint so Go launcher can read them from configMap
  const startupArgs = (form as ProfileForm & { startup_args?: string[] }).startup_args;
  if (Array.isArray(startupArgs) && startupArgs.length > 0) {
    fpOverrides.startup_args = startupArgs;
  }

  return {
    ...rest,
    cookies,
    ...(Object.keys(fpOverrides).length > 0 ? { fingerprint: fpOverrides } : {}),
  };
}
