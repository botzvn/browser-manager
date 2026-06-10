import os from "os";
import { UA_PROFILES, CHROME_VERSIONS, MAC_M1_CORES, MAC_M1_MEM, MAC_M2_CORES, MAC_M2_MEM, MAC_M3_CORES, MAC_M3_MEM, WIN_CORES, WIN_MEM } from "./profiles.constants.js";
import { mergeDeep } from "../../utils/common.js";

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isSoftwareWebglConfig(webgl) {
  return /SwiftShader|Subzero|0x0000C0DE/i.test(webgl?.unmaskedRenderer || "");
}

export function stripChromiumManagedFingerprintFields(fingerprint = {}) {
  if (!fingerprint || typeof fingerprint !== "object") return fingerprint;
  const result = { ...fingerprint };
  // Keep WebGPU in the profile config: BotZVN C++ reads this block for
  // supported features, limits, adapter fallback state, and canvas format.
  delete result.fonts;
  // Strip legacy root-level fields that should not exist at root
  // (they belong inside client_hints or were from old schema)
  delete result.full_version;
  delete result.resolution;
  delete result.user_agent;
  delete result.os;
  delete result.vendor;
  delete result.architecture;
  delete result.bitness;
  delete result.mobile;
  delete result.model;
  delete result.platform;
  delete result.platform_version;
  return result;
}

export function generateFingerprint(overrides = {}) {
  // 1. Determine OS Key
  let defaultOsKey = "windows";
  if (process.platform === "darwin") {
    defaultOsKey = process.arch === "arm64" ? "mac_apple_silicon" : "mac";
  } else if (process.platform === "linux") {
    defaultOsKey = "linux";
  }

  let osKey = overrides.os || defaultOsKey;

  // Coherent OS/GPU mapping
  if (osKey === "mac" && overrides.webgl?.unmaskedRenderer?.includes("Apple")) {
    osKey = "mac_apple_silicon";
  } else if (osKey === "mac_apple_silicon" && overrides.webgl?.unmaskedRenderer && !overrides.webgl.unmaskedRenderer.includes("Apple")) {
    osKey = "mac";
  }

  if (osKey === "mac" && !overrides.webgl?.unmaskedRenderer) {
    if (Math.random() < 0.8) {
      osKey = "mac_apple_silicon";
    }
  }

  const osProfile = UA_PROFILES.find((p) => p.os === osKey) || UA_PROFILES.find((p) => p.os === defaultOsKey) || randomItem(UA_PROFILES);

  // 2. Select Chrome Version
  let majorVersion, fullVersion;
  const uaFromOverride = overrides?.navigator?.userAgent;

  if (uaFromOverride) {
    const m = uaFromOverride.match(/Chrome\/(\d+)\./);
    if (m) {
      majorVersion = m[1];
      const poolEntry = CHROME_VERSIONS.find(([maj]) => maj === majorVersion);
      fullVersion = poolEntry ? poolEntry[1] : `${majorVersion}.0.0.0`;
    }
  }

  if (!majorVersion && overrides.chrome_version && Array.isArray(overrides.chrome_version)) {
    majorVersion = overrides.chrome_version[0];
    fullVersion = overrides.chrome_version[1];
  }

  if (!majorVersion) {
    const poolEntry = randomItem(CHROME_VERSIONS);
    majorVersion = poolEntry[0];
    fullVersion = poolEntry[1];
  }

  const ua = osProfile.user_agent(majorVersion, fullVersion);
  const hardwareWebglConfigs = osProfile.webgl_configs.filter((cfg) => !isSoftwareWebglConfig(cfg));
  const webgl = randomItem(hardwareWebglConfigs.length ? hardwareWebglConfigs : osProfile.webgl_configs);
  const isMac = osProfile.os === "mac" || osProfile.os === "mac_apple_silicon";

  // 3. Resolve Screen Dimensions
  let baseWidth, baseHeight;

  if (overrides?.screen?.width && overrides?.screen?.height && !overrides?.screen?.hostWidth) {
    baseWidth = overrides.screen.width;
    baseHeight = overrides.screen.height;
  } else if (overrides?.resolution && typeof overrides.resolution === "string") {
    const [w, h] = overrides.resolution.split("x").map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      baseWidth = w;
      baseHeight = h;
    }
  } else {
    const hostWidth = overrides?.screen?.hostWidth || 1920;
    const hostHeight = overrides?.screen?.hostHeight || 1080;

    const MAC_RESOLUTIONS = [
      { w: 2560, h: 1600 },
      { w: 2560, h: 1440 },
      { w: 1920, h: 1080 },
      { w: 1728, h: 1117 },
      { w: 1512, h: 982 },
      { w: 1440, h: 900 },
    ];

    const WIN_RESOLUTIONS = [
      { w: 1920, h: 1080 },
      { w: 1600, h: 900 },
      { w: 1536, h: 864 },
      { w: 1440, h: 900 },
      { w: 1366, h: 768 },
      { w: 1280, h: 720 },
    ];

    const targetResolutions = isMac ? MAC_RESOLUTIONS : WIN_RESOLUTIONS;
    const fitRes = targetResolutions.find((r) => r.w <= hostWidth && r.h <= hostHeight);

    if (fitRes) {
      baseWidth = fitRes.w;
      baseHeight = fitRes.h;
    } else {
      baseWidth = isMac ? 1440 : 1366;
      baseHeight = isMac ? 900 : 768;
    }
  }

  if (overrides?.screen) {
    delete overrides.screen.hostWidth;
    delete overrides.screen.hostHeight;
  }

  const wgl2 = osProfile.webgl2_config;
  const computedScreen = generateScreenBounds(baseWidth, baseHeight, osKey, overrides.screen || {});

  // 4. Construct Base Configuration
  const baseConfig = {
    navigator: {
      userAgent: ua,
      platform: osProfile.navigator_platform,
      language: "en-US",
      vendor: "Google Inc.",
      hardwareConcurrency: 8,
      deviceMemory: 8,
    },
    client_hints: {
      platform: osProfile.platform,
      platform_version: osProfile.os === "windows" ? (Math.random() < 0.5 ? "15.0.0" : "10.0.0") : osProfile.platform_version,
      architecture: osProfile.os === "mac_apple_silicon" ? "arm" : "x86",
      bitness: "64",
      mobile: false,
      wow64: false,
      model: "",
      full_version: fullVersion,
    },
    spoof_drm: true,
    hide_parse_html_unsafe: false,
    webgl: {
      vendor: webgl.vendor,
      renderer: webgl.renderer,
      unmaskedVendor: webgl.unmaskedVendor,
      unmaskedRenderer: webgl.unmaskedRenderer,
    },
    webgl2: {
      glVersion: wgl2.glVersion,
      glslVersion: wgl2.glslVersion,
      MAX_VERTEX_UNIFORM_BLOCKS: randomItem(wgl2.MAX_VERTEX_UNIFORM_BLOCKS),
      MAX_FRAGMENT_UNIFORM_BLOCKS: randomItem(wgl2.MAX_FRAGMENT_UNIFORM_BLOCKS),
      MAX_UNIFORM_BUFFER_BINDINGS: 24,
      MAX_COMBINED_UNIFORM_BLOCKS: 24,
      MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: randomItem(wgl2.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS),
      MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: randomItem(wgl2.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS),
    },
  };

  if (overrides?._resolutionMode !== "default" && baseWidth && baseHeight) {
    baseConfig.screen = computedScreen;
  }

  baseConfig._resolutionMode = overrides?._resolutionMode || "fit";

  // Hardware concurrency and RAM mapping
  if (osKey === "mac" || osKey === "mac_apple_silicon") {
    const gpuMemCores = (renderer) => {
      if (renderer.includes("M1")) return { mem: MAC_M1_MEM, cores: MAC_M1_CORES };
      if (renderer.includes("M2")) return { mem: MAC_M2_MEM, cores: MAC_M2_CORES };
      if (renderer.includes("M3")) return { mem: MAC_M3_MEM, cores: MAC_M3_CORES };
      return { mem: [8, 16], cores: [8] };
    };
    const { mem, cores } = gpuMemCores(webgl.unmaskedRenderer);
    baseConfig.navigator.deviceMemory = randomItem(mem);
    baseConfig.navigator.hardwareConcurrency = randomItem(cores);
  } else {
    baseConfig.navigator.deviceMemory = randomItem(WIN_MEM);
    baseConfig.navigator.hardwareConcurrency = randomItem(WIN_CORES);
  }

  // 5. Merge Overrides
  const { os: _os, chrome_version: _cv, ...safeOverrides } = overrides;

  if (safeOverrides.webgl) {
    if (safeOverrides.webgl.vendor && !safeOverrides.webgl.unmaskedVendor) {
      safeOverrides.webgl.unmaskedVendor = safeOverrides.webgl.vendor;
      if (safeOverrides.webgl.renderer) {
        safeOverrides.webgl.unmaskedRenderer = safeOverrides.webgl.renderer;
      }
    }
    safeOverrides.webgl.vendor = "WebKit";
    safeOverrides.webgl.renderer = "WebKit WebGL";
  }

  if (safeOverrides.screen) {
    // Delete geometry keys from overrides so they don't corrupt the newly calculated baseConfig.screen
    delete safeOverrides.screen.width;
    delete safeOverrides.screen.height;
    delete safeOverrides.screen.availWidth;
    delete safeOverrides.screen.availHeight;
    delete safeOverrides.screen.innerWidth;
    delete safeOverrides.screen.innerHeight;
    delete safeOverrides.screen.outerWidth;
    delete safeOverrides.screen.outerHeight;
    delete safeOverrides.screen.availTop;
    delete safeOverrides.screen.availLeft;
  }

  const result = mergeDeep(baseConfig, safeOverrides);

  // 6. Normalize dynamic / API formats
  if (result.timezone && typeof result.timezone === "string") {
    result.timezone = { value: result.timezone, duration: 0 };
  }

  if (result.geolocation && typeof result.geolocation === "object") {
    result.geolocation = {
      latitude: result.geolocation.latitude ?? 0,
      longitude: result.geolocation.longitude ?? 0,
      accuracy: result.geolocation.accuracy ?? 100,
    };
  }

  // 7. Enforce platform/Chrome spec limits and invariants
  if (osKey === "mac" || osKey === "mac_apple_silicon") {
    result.navigator.hardwareConcurrency = 8;
    const validChromeMem = [4, 8];
    if (!validChromeMem.includes(result.navigator.deviceMemory)) {
      result.navigator.deviceMemory = 8;
    }
  } else if (osKey === "windows" || osKey === "linux") {
    if (result.navigator.deviceMemory > 8) result.navigator.deviceMemory = 8;
  }

  if (result.client_hints) {
    result.client_hints.architecture = osKey === "mac_apple_silicon" ? "arm" : "x86";
    result.client_hints.platform = osProfile.platform;
    result.client_hints.platform_version = result.client_hints.platform_version || osProfile.platform_version;
  }

  if (result.navigator) {
    result.navigator.platform = osProfile.navigator_platform;
  }

  result.hide_parse_html_unsafe = false;

  if (result.webgl?.unmaskedRenderer && result.webgl?.renderer) {
    const gpuModelMatch = result.webgl.unmaskedRenderer.match(/Apple (M\d+)/);
    if (gpuModelMatch) {
      const gpuModel = gpuModelMatch[1];
      result.webgl.renderer = result.webgl.renderer.replace(/Apple M\d+/, `Apple ${gpuModel}`);
    }
  }

  // Auto-generate languages list at root from navigator.language
  if (result.navigator && result.navigator.language && !result.languages) {
    const lang = result.navigator.language;
    const shortLang = lang.split("-")[0];
    result.languages = lang.includes("-") && shortLang !== lang ? [lang, shortLang] : [lang];
  }

  if (result.navigator) {
    delete result.navigator.languages;
  }

  // Clean legacy fields
  delete result.resolution;
  delete result.user_agent;
  delete result.os;
  delete result.vendor;
  delete result.webgl_vendor;
  delete result.webgl_renderer;
  delete result.webgl_unmasked_vendor;
  delete result.webgl_unmasked_renderer;
  delete result.hardware_concurrency;
  delete result.device_memory;
  delete result.canvas_noise;
  delete result.canvas_seed;
  delete result.audio_noise;
  delete result.audio_seed;
  delete result.architecture;
  delete result.bitness;
  delete result.mobile;
  delete result.model;
  delete result.platform;
  delete result.platform_version;
  delete result.full_version;

  if (overrides._resolutionMode) {
    result._resolutionMode = overrides._resolutionMode;
  }

  // Strip null properties that were explicitly unset by the frontend
  for (const key of Object.keys(result)) {
    if (result[key] === null) {
      delete result[key];
    }
  }

  return stripChromiumManagedFingerprintFields(result);
}

export function getWebglConfigs(os) {
  const profiles = UA_PROFILES.filter((p) => p.os === os);
  const configs = [];
  for (const profile of profiles) {
    for (const cfg of profile.webgl_configs) {
      const match = cfg.unmaskedRenderer.match(/ANGLE \((.+)\)/);
      const label = match ? match[1] : cfg.unmaskedRenderer;
      configs.push({ label, ...cfg });
    }
  }
  return configs;
}

export function getAvailableOs() {
  return [
    { value: "mac_apple_silicon", label: "macOS (Apple Silicon)" },
    { value: "mac", label: "macOS (Intel)" },
    { value: "windows", label: "Windows" },
    { value: "linux", label: "Linux" },
  ];
}

export function generateScreenBounds(baseWidth, baseHeight, osKey, existingScreen = {}) {
  const isMac = osKey === "mac" || osKey === "mac_apple_silicon";

  let taskbarHeight = 40;
  if (isMac) {
    taskbarHeight = baseWidth === 1512 || baseWidth === 1728 || baseWidth === 1710 ? 38 : 25;
  }

  const availTop = isMac ? taskbarHeight : 0;
  const availHeight = baseHeight - taskbarHeight;
  const chromeUIHeight = isMac ? 78 : 87;

  const outerHeight = baseHeight;
  const innerHeight = outerHeight - chromeUIHeight;

  const result = {
    ...existingScreen,
    width: baseWidth,
    height: baseHeight,
    availWidth: baseWidth,
    availHeight,
    availTop,
    availLeft: 0,
    outerWidth: baseWidth,
    outerHeight,
    innerWidth: baseWidth,
    innerHeight,
  };

  if (existingScreen.devicePixelRatio !== undefined) result.devicePixelRatio = existingScreen.devicePixelRatio;
  if (existingScreen.colorDepth !== undefined) result.colorDepth = existingScreen.colorDepth;
  if (existingScreen.pixelDepth !== undefined) result.pixelDepth = existingScreen.pixelDepth;

  return result;
}

// ---------------------------------------------------------------------------
// OS-derived root fields that generator handles — must be stripped before merge
// ---------------------------------------------------------------------------
const LEGACY_ROOT_FIELDS = [
  "user_agent", "full_version", "brands", "full_version_list",
  "platform", "platform_version", "resolution", "os", "vendor",
  "architecture", "bitness", "mobile", "model", "chrome_version",
  "hardware_concurrency", "device_memory", "canvas_noise", "canvas_seed",
  "audio_noise", "audio_seed", "webgl_vendor", "webgl_renderer",
  "webgl_unmasked_vendor", "webgl_unmasked_renderer",
];

/**
 * Strip all version/OS-derived fields from a fingerprint object so that
 * generateFingerprint() always recomputes them from scratch and they stay
 * internally consistent.
 *
 * @param {object} fp - raw fingerprint object
 * @param {boolean} isOsChanged - if true, also wipe WebGL and hardware fields
 */
function cleanFingerprint(fp, isOsChanged = false) {
  if (!fp || typeof fp !== "object") return {};
  const result = JSON.parse(JSON.stringify(fp));

  // 1. Strip legacy flat root keys
  for (const key of LEGACY_ROOT_FIELDS) delete result[key];

  // 2. Strip version/platform fields inside client_hints — generator owns these
  if (result.client_hints) {
    delete result.client_hints.full_version;
    delete result.client_hints.platform;
    delete result.client_hints.platform_version;
  }

  // 3. Strip UA fields inside navigator — generator owns these
  if (result.navigator) {
    delete result.navigator.userAgent;
    delete result.navigator.appVersion;
    delete result.navigator.platform;
  }

  // 4. If OS changed, wipe hardware and GPU configs so generator picks fresh ones
  if (isOsChanged) {
    delete result.webgl;
    delete result.webgl2;
    if (result.client_hints) {
      delete result.client_hints.architecture;
      delete result.client_hints.bitness;
      delete result.client_hints.model;
    }
    if (result.navigator) {
      delete result.navigator.deviceMemory;
      delete result.navigator.hardwareConcurrency;
    }
    if (result.screen) delete result.screen.devicePixelRatio;
  }

  return result;
}

function normalizeCreateResolutionMode(fp) {
  if (!fp || typeof fp !== "object") return;
  // A cold profile with an explicit "default" resolution produces no concrete
  // screen block in BOTZVN_CONFIG. That leaves native code to expose container
  // bounds instead of the generated profile geometry. Use the generated fit
  // bounds unless a caller provided concrete custom dimensions.
  if (fp._resolutionMode === "default") {
    fp._resolutionMode = "fit";
  }
}

/**
 * Resolve Chrome version tuple [majorVersion, fullVersion] from multiple sources
 * with priority: requestFp.chrome_version → user_agent → existingFp.client_hints.full_version
 */
function resolveChromeVersion(requestFp, userAgent, existingFp = null) {
  // 1. Explicit chrome_version tuple from frontend (e.g. ["145", "145.0.7632.119"])
  if (Array.isArray(requestFp?.chrome_version)) {
    const [maj, fv] = requestFp.chrome_version;
    if (maj && fv) return [maj, fv];
  }

  // 2. From user_agent string
  const ua = userAgent || requestFp?.user_agent;
  if (ua) {
    const m = ua.match(/Chrome\/(\d+)\./);
    if (m) {
      const major = m[1];
      // Try to preserve existing full version if major matches
      const existingFull = existingFp?.client_hints?.full_version;
      const fv = existingFull && existingFull.startsWith(`${major}.`) ? existingFull : `${major}.0.0.0`;
      return [major, fv];
    }
  }

  // 3. Preserve existing version from client_hints (most reliable stored source)
  const existingFull = existingFp?.client_hints?.full_version;
  if (existingFull) {
    const m = existingFull.match(/^(\d+)\./);
    if (m) return [m[1], existingFull];
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Public: compute fingerprint for profile CREATE
// ---------------------------------------------------------------------------
export function computeCreateFingerprint(input, defaultWidth, defaultHeight) {
  const os = input.os || input.fingerprint?.os || "linux";
  const requestFp = input.fingerprint || {};

  const chromeVersion = resolveChromeVersion(requestFp, input.user_agent);
  const cleanedFp = cleanFingerprint(requestFp, false);
  normalizeCreateResolutionMode(cleanedFp);

  // Resolve screen — honour explicit dimensions or fall back to defaults
  const targetWidth = cleanedFp.screen?.width || input.screen?.width || defaultWidth;
  const targetHeight = cleanedFp.screen?.height || input.screen?.height || defaultHeight;
  if (targetWidth && targetHeight) {
    cleanedFp.screen = { ...(cleanedFp.screen || {}), width: targetWidth, height: targetHeight };
  }

  const overrides = {
    os,
    ...(chromeVersion ? { chrome_version: chromeVersion } : {}),
    ...cleanedFp,
  };

  return generateFingerprint(overrides);
}

// ---------------------------------------------------------------------------
// Public: compute fingerprint for profile UPDATE
// ---------------------------------------------------------------------------
export function computeUpdateFingerprint(existing, patch, defaultWidth, defaultHeight) {
  const fingerprintChanged = Boolean(patch.fingerprint || patch.screen || patch.os || patch.user_agent);
  if (!fingerprintChanged) return null;

  const existingFp = existing.fingerprint || {};
  const isOsChanged = Boolean(patch.os && patch.os !== existing.os);
  const effectiveOs = patch.os ?? existing.os ?? "linux";

  // Clean both sides so generator always recomputes version/OS fields
  const stableExistingFp = cleanFingerprint(existingFp, isOsChanged);
  const requestFp = patch.fingerprint || {};
  const cleanedRequestFp = cleanFingerprint(requestFp, false);
  normalizeCreateResolutionMode(cleanedRequestFp);

  // Handle explicit null overrides (frontend signals "delete this key")
  for (const key of Object.keys(requestFp)) {
    if (requestFp[key] === null) delete stableExistingFp[key];
  }

  // Resolve version: frontend chrome_version > patch UA > existing UA
  const chromeVersion = resolveChromeVersion(requestFp, patch.user_agent, existingFp);

  // Resolve screen dimensions
  const newWidth = patch.screen?.width || requestFp.screen?.width;
  const newHeight = patch.screen?.height || requestFp.screen?.height;
  if (newWidth && newHeight) {
    cleanedRequestFp.screen = {
      ...(cleanedRequestFp.screen || {}),
      width: newWidth,
      height: newHeight,
    };
  } else if (!cleanedRequestFp.screen?.width && stableExistingFp.screen?.width) {
    // Preserve existing screen if no new screen provided
    cleanedRequestFp.screen = cleanedRequestFp.screen || stableExistingFp.screen;
  }

  const overrides = {
    os: effectiveOs,
    ...(chromeVersion ? { chrome_version: chromeVersion } : {}),
    ...stableExistingFp,   // existing settings as base
    ...cleanedRequestFp,   // request overrides on top
  };

  return generateFingerprint(overrides);
}
