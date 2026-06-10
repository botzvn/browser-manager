import http from "node:http";
import { config } from "./config.js";
import { ensureDir } from "./utils/fs.js";
import { initContext } from "./context.js";
import { createApp } from "./app.js";

await initContext();
await ensureDir(config.dataDir);
await ensureDir(config.profilesDir);
await ensureDir(config.logsDir);
await ensureDir(config.runtimeDir);

const { app, runtimeManager, vncBridge, cdpBridge } = createApp();
const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  if (vncBridge.handleUpgrade(request, socket, head)) return;
  if (cdpBridge.handleUpgrade(request, socket, head)) return;
  socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
  socket.destroy();
});

async function shutdown() {
  console.log("Stopping BotZVN manager...");
  await runtimeManager.cleanupAll();
  const { databaseManager } = await import("./database.js");
  await databaseManager.destroy();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(config.port, "0.0.0.0", () => {
  console.log(`BotZVN Manager running at http://0.0.0.0:${config.port}`);
});
