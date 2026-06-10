import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { ensureDir, pathExists } from "../utils/fs.js";
import { waitForHttpJson } from "../utils/http.js";
import { Allocator } from "./allocator.js";
import { assertExecutable, spawnLogged, stopProcessTree } from "./process-utils.js";
import { waitForPort } from "./port-utils.js";
import { stripChromiumManagedFingerprintFields } from "../modules/profiles/profiles.service.js";

function buildBotzvnProxyUrl(profile) {
  const host = String(profile?.proxy_host || "").trim();
  const port = Number(profile?.proxy_port || 0);
  if (!host || !Number.isFinite(port) || port <= 0) return null;

  const rawType = String(profile?.proxy_type || "http").trim().toLowerCase();
  const scheme = rawType === "socks5" ? "socks5" : rawType === "socks4" ? "socks4" : rawType === "https" ? "https" : "http";
  const username = String(profile?.proxy_username || "");
  const password = String(profile?.proxy_password || "");
  const auth = username ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ""}@` : "";
  return `${scheme}://${auth}${host}:${port}`;
}

export class ProfileRuntimeManager {
  constructor() {
    this.running = new Map();
    this.locks = new Map();
    this.displayAllocator = new Allocator(config.displayBase, config.displayMax, "display");
    this.cdpAllocator = new Allocator(config.cdpPortBase, config.cdpPortMax, "CDP port");
    this.vncAllocator = new Allocator(config.vncPortBase, config.vncPortMax, "VNC port");
  }

  async withProfileLock(profileId, fn) {
    const previous = this.locks.get(profileId) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    const next = previous.then(() => current);
    this.locks.set(profileId, next);
    await previous;
    try {
      return await fn();
    } finally {
      release();
      if (this.locks.get(profileId) === next) this.locks.delete(profileId);
    }
  }

  get(profileId) {
    return this.running.get(profileId) || null;
  }

  list() {
    return [...this.running.values()].map((runtime) => this.publicRuntime(runtime));
  }

  publicRuntime(runtime) {
    if (!runtime) return { status: "stopped" };
    return {
      status: "running",
      profileId: runtime.profile.id,
      display: `:${runtime.display}`,
      cdpPort: runtime.cdpPort,
      cdpUrl: `/api/profiles/${runtime.profile.id}/cdp`,
      viewer: runtime.viewer
        ? {
            active: true,
            viewerCount: runtime.viewer.viewerCount,
            vncPort: runtime.viewer.vncPort,
            wsPath: `/api/profiles/${runtime.profile.id}/vnc`,
          }
        : { active: false, viewerCount: 0 },
    };
  }

  async start(profile) {
    return this.withProfileLock(profile.id, async () => {
      if (this.running.has(profile.id)) {
        throw Object.assign(new Error("Profile is already running"), { statusCode: 409 });
      }
      assertExecutable(config.botzvnPath, "BotZVN binary");
      if (this.shouldUseConfigFile(profile) && !(await pathExists(profile.botzvnConfigPath))) {
        throw Object.assign(new Error(`BOTZVN config not found: ${profile.botzvnConfigPath}`), { statusCode: 400 });
      }

      const display = this.displayAllocator.allocateNumber();
      const cdpPort = await this.cdpAllocator.allocatePort();
      const runtime = {
        profile,
        display,
        cdpPort,
        xvfb: null,
        browser: null,
        viewer: null,
      };

      try {
        await this.cleanProfileLocks(profile.userDataDir);
        await ensureDir(profile.userDataDir);
        await ensureDir(config.logsDir);
        await this.startXvfb(runtime);
        await this.startBrowser(runtime);
        await this.waitForBrowserReady(runtime);
        this.running.set(profile.id, runtime);
        return this.publicRuntime(runtime);
      } catch (error) {
        await this.stopRuntime(runtime);
        this.displayAllocator.release(display);
        this.cdpAllocator.release(cdpPort);
        throw error;
      }
    });
  }

  async waitForBrowserReady(runtime) {
    try {
      const timeoutMs = config.browserCdpTimeoutMs;
      await waitForHttpJson(`http://127.0.0.1:${runtime.cdpPort}/json/version`, timeoutMs);
    } catch (error) {
      const exitInfo =
        runtime.browser?.exitCode !== null
          ? ` BotZVN exited with code ${runtime.browser.exitCode}.`
          : runtime.browser?.signalCode
            ? ` BotZVN exited with signal ${runtime.browser.signalCode}.`
            : "";
      throw Object.assign(new Error(`BotZVN did not open CDP at 127.0.0.1:${runtime.cdpPort}.${exitInfo} Check log: ${runtime.browserLogPath}`), { statusCode: 502, cause: error });
    }
  }

  async stop(profileId) {
    return this.withProfileLock(profileId, async () => {
      const runtime = this.running.get(profileId);
      if (!runtime) {
        throw Object.assign(new Error("Profile is not running"), { statusCode: 404 });
      }
      await this.stopRuntime(runtime);
      this.running.delete(profileId);
      this.displayAllocator.release(runtime.display);
      this.cdpAllocator.release(runtime.cdpPort);
      return { ok: true };
    });
  }

  async startViewer(profileId) {
    return this.withProfileLock(profileId, async () => {
      const runtime = this.running.get(profileId);
      if (!runtime) {
        throw Object.assign(new Error("Profile is not running"), { statusCode: 404 });
      }
      if (runtime.viewer) {
        runtime.viewer.viewerCount += 1;
        clearTimeout(runtime.viewer.idleTimer);
        runtime.viewer.idleTimer = null;
        return this.publicRuntime(runtime).viewer;
      }
      const vncPort = await this.vncAllocator.allocatePort();
      const logPath = path.join(config.logsDir, `${profileId}.x11vnc.log`);
      const args = ["-display", `:${runtime.display}`, "-rfbport", String(vncPort), "-localhost", "-shared", "-forever", "-nopw", "-noxdamage", "-repeat"];
      const x11vnc = await spawnLogged("x11vnc", args, {
        env: process.env,
        logPath,
      });
      runtime.viewer = {
        vncPort,
        x11vnc,
        viewerCount: 1,
        idleTimer: null,
      };
      try {
        await waitForPort(vncPort, 10000);
      } catch (error) {
        await this.stopViewerNow(runtime);
        throw error;
      }
      return this.publicRuntime(runtime).viewer;
    });
  }

  async stopViewer(profileId) {
    return this.withProfileLock(profileId, async () => {
      const runtime = this.running.get(profileId);
      if (!runtime || !runtime.viewer) return { ok: true };
      runtime.viewer.viewerCount = Math.max(0, runtime.viewer.viewerCount - 1);
      if (runtime.viewer.viewerCount === 0) {
        runtime.viewer.idleTimer = setTimeout(() => {
          this.withProfileLock(profileId, async () => {
            const latest = this.running.get(profileId);
            if (latest?.viewer?.viewerCount === 0) await this.stopViewerNow(latest);
          }).catch(() => {});
        }, config.viewIdleMs);
      }
      return { ok: true };
    });
  }

  async stopViewerNow(runtime) {
    if (!runtime.viewer) return;
    clearTimeout(runtime.viewer.idleTimer);
    await stopProcessTree(runtime.viewer.x11vnc, "x11vnc", 3000);
    this.vncAllocator.release(runtime.viewer.vncPort);
    runtime.viewer = null;
  }

  async startXvfb(runtime) {
    const { width, height } = runtime.profile.screen;
    const logPath = path.join(config.logsDir, `${runtime.profile.id}.xvfb.log`);
    runtime.xvfb = await spawnLogged("Xvfb", [`:${runtime.display}`, "-screen", "0", `${width}x${height}x24`, "-nolisten", "tcp", "-ac"], { env: process.env, logPath });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (runtime.xvfb.exitCode !== null) throw new Error(`Xvfb exited early for ${runtime.profile.id}`);
  }

  async startBrowser(runtime) {
    const profile = runtime.profile;
    const rawConfig = await this.resolveBotzvnConfig(profile);
    const parsedConfig = JSON.parse(rawConfig);
    const token = profile.botzvnToken || config.browserToken;
    if (!token) {
      throw Object.assign(new Error("BOTZVN_TOKEN is required. Set it in botzvn-manager-node/.env or save a token on the profile."), { statusCode: 400 });
    }
    const logPath = path.join(config.logsDir, `${profile.id}.botzvn.log`);
    runtime.browserLogPath = logPath;
    const args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-blink-features=AutomationControlled",
      "--disable-crash-reporter",
      "--disable-session-crashed-bubble",
      "--disable-search-engine-choice-screen",
      "--disable-sync",
      "--password-store=basic",
      "--use-mock-keychain",
      "--enable-features=OverlayScrollbar,OverlayScrollbarFlashAfterAnyScrollUpdate,OverlayScrollbarFlashWhenMouseEnter,WebShare",
      "--botzvn-cdp-navigation-as-address-bar",
      "--ozone-platform=x11",
      "--ignore-gpu-blocklist",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--enable-unsafe-webgpu",
      `--user-data-dir=${profile.userDataDir}`,
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${runtime.cdpPort}`,
      `--window-size=${profile.screen.width},${profile.screen.height}`,
      "--start-maximized",
      "--force-visible",
      "--no-pings",
      ...profile.launchArgs,
    ];
    // args.push(profile.url || "about:blank");
    
    runtime.browser = await spawnLogged(config.botzvnPath, args, {
      env: {
        ...process.env,
        DISPLAY: `:${runtime.display}`,
        BOTZVN_CONFIG: rawConfig,
        BOTZVN_TOKEN: token,
        TZ: parsedConfig?.timezone?.value || process.env.TZ || "Asia/Saigon",
      },
      logPath,
    });
  }

  shouldUseConfigFile(profile) {
    return Boolean(profile.botzvnConfigPath && profile.botzvnConfigPath !== config.defaultConfigFile);
  }

  async resolveBotzvnConfig(profile) {
    const proxy = buildBotzvnProxyUrl(profile);

    if (profile.botzvnConfigPath && (await pathExists(profile.botzvnConfigPath))) {
      const rawConfig = await fs.readFile(profile.botzvnConfigPath, "utf8");
      const parsedConfig = JSON.parse(rawConfig);
      if (proxy) parsedConfig.proxy = proxy;
      return JSON.stringify(parsedConfig);
    }

    if (profile.fingerprint && Object.keys(profile.fingerprint).length > 0) {
      const config = stripChromiumManagedFingerprintFields(profile.fingerprint);
      if (proxy) config.proxy = proxy;
      return JSON.stringify(config);
    }

    throw Object.assign(new Error("Profile does not have a BotZVN fingerprint config"), { statusCode: 400 });
  }

  async stopRuntime(runtime) {
    await this.stopViewerNow(runtime);
    try {
      await fetch(`http://127.0.0.1:${runtime.cdpPort}/json/version`)
        .then((res) => res.json())
        .then((data) => {
          if (data.webSocketDebuggerUrl) {
            // CDP graceful Browser.close is intentionally deferred to keep
            // dependencies small in the first pass. SIGTERM handles cleanup.
          }
        });
    } catch {
      // CDP may already be down.
    }
    await stopProcessTree(runtime.browser, "botzvn", 5000);
    await stopProcessTree(runtime.xvfb, "Xvfb", 3000);
  }

  async cleanProfileLocks(userDataDir) {
    await ensureDir(userDataDir);
    for (const name of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) {
      await fs.rm(path.join(userDataDir, name), { force: true, recursive: true });
    }
  }

  async cleanupAll() {
    for (const profileId of [...this.running.keys()]) {
      await this.stop(profileId).catch(() => {});
    }
  }
}
