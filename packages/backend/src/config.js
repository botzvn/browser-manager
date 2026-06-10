import path from "node:path";

const dataDir =
  process.env.MANAGER_DATA_DIR ||
  path.resolve(process.cwd(), ".botzvn-manager");
const runtimeDir =
  process.env.RUNTIME_DIR ||
  path.join(dataDir, "runtime");
const botzvnPath =
  process.env.BROWSER_PATH ||
  path.join(process.cwd(), "bin", "botzvn");

export const config = {
  port: Number(process.env.PORT || process.env.MANAGER_PORT || 8080),
  dataDir,
  databaseSetupFile:
    process.env.DATABASE_SETUP_FILE || path.join(dataDir, "database-setup.json"),
  databaseUrl: process.env.DATABASE_URL || "",
  databaseClient: process.env.DATABASE_CLIENT || "",
  sqliteFile: process.env.SQLITE_FILE || path.join(dataDir, "botzvn-manager.db"),
  profilesDir: process.env.PROFILES_DIR || path.join(dataDir, "profiles"),
  logsDir: process.env.LOGS_DIR || path.join(dataDir, "logs"),
  runtimeDir,
  botzvnPath,
  defaultConfigFile: process.env.CONFIG_FILE || "",

  defaultWidth: Number(process.env.SCREEN_WIDTH || 1365),
  defaultHeight: Number(process.env.SCREEN_HEIGHT || 768),
  displayBase: Number(process.env.DISPLAY_BASE || 100),
  displayMax: Number(process.env.DISPLAY_MAX || 299),
  cdpPortBase: Number(process.env.CDP_PORT_BASE || 9300),
  cdpPortMax: Number(process.env.CDP_PORT_MAX || 9499),
  vncPortBase: Number(process.env.VNC_PORT_BASE || 5900),
  vncPortMax: Number(process.env.VNC_PORT_MAX || 6099),
  viewIdleMs: Number(process.env.VIEW_IDLE_MS || 30000),
  browserCdpTimeoutMs: Number(process.env.BROWSER_CDP_TIMEOUT_MS || 45000),
  browserToken: process.env.BOTZVN_TOKEN || "w930Xitejc69TM4hEPOa2V0j9U5/prZ30s5NWnf-5VJm8PjoYo/ehusKvSHRc9ol3zJfLVBVpP3OIjOCwrza",
};
