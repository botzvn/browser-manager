import WebSocket, { WebSocketServer } from "ws";

export function createCdpRouter(app, runtimeManager) {
  app.get("/api/profiles/:id/cdp", (req, res) => {
    const runtime = runtimeManager.get(req.params.id);
    if (!runtime) return res.status(404).json({ error: "Profile is not running" });
    return res.json({
      cdpUrl: `/api/profiles/${req.params.id}/cdp`,
      usage: `playwright.chromium.connectOverCDP('${req.protocol}://${req.get("host")}/api/profiles/${req.params.id}/cdp')`,
    });
  });

  app.get("/api/profiles/:id/cdp/json/version", async (req, res, next) => {
    try {
      const data = await fetchCdpJson(runtimeManager, req.params.id, "/json/version");
      const wsUrl = new URL(data.webSocketDebuggerUrl);
      data.webSocketDebuggerUrl = `${req.protocol === "https" ? "wss" : "ws"}://${req.get("host")}/api/profiles/${req.params.id}/cdp${wsUrl.pathname}`;
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get(["/api/profiles/:id/cdp/json", "/api/profiles/:id/cdp/json/list"], async (req, res, next) => {
    try {
      const data = await fetchCdpJson(runtimeManager, req.params.id, "/json/list");
      for (const entry of data) {
        if (!entry.webSocketDebuggerUrl) continue;
        const wsUrl = new URL(entry.webSocketDebuggerUrl);
        entry.webSocketDebuggerUrl = `${req.protocol === "https" ? "wss" : "ws"}://${req.get("host")}/api/profiles/${req.params.id}/cdp${wsUrl.pathname}`;
      }
      res.json(data);
    } catch (error) {
      next(error);
    }
  });
}

async function fetchCdpJson(runtimeManager, profileId, path) {
  const runtime = runtimeManager.get(profileId);
  if (!runtime) {
    const error = new Error("Profile is not running");
    error.statusCode = 404;
    throw error;
  }
  const res = await fetch(`http://127.0.0.1:${runtime.cdpPort}${path}`);
  if (!res.ok) throw new Error(`CDP returned HTTP ${res.status}`);
  return res.json();
}

export class CdpWsBridge {
  constructor(runtimeManager) {
    this.runtimeManager = runtimeManager;
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on("connection", (clientWs, request, targetUrl) => {
      this.bridge(clientWs, targetUrl);
    });
  }

  handleUpgrade(request, socket, head) {
    const url = new URL(request.url, "http://localhost");
    const match = url.pathname.match(/^\/api\/profiles\/([^/]+)\/cdp(\/devtools\/.+)$/);
    if (!match) return false;
    const profileId = decodeURIComponent(match[1]);
    const runtime = this.runtimeManager.get(profileId);
    if (!runtime) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return true;
    }
    const targetUrl = `ws://127.0.0.1:${runtime.cdpPort}${match[2]}`;
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit("connection", ws, request, targetUrl);
    });
    return true;
  }

  bridge(clientWs, targetUrl) {
    const targetWs = new WebSocket(targetUrl);
    targetWs.binaryType = "arraybuffer";
    const queue = [];
    
    targetWs.onopen = () => {
      console.log(`[CDP] targetWs open, queue size: ${queue.length}`);
      while (queue.length > 0) {
        const item = queue.shift();
        targetWs.send(item.data, { binary: item.isBinary });
      }
    };
    targetWs.onmessage = (event) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(event.data, { binary: event.isBinary || typeof event.data !== "string" });
      }
    };
    targetWs.onerror = (err) => {
      console.error(`[CDP] targetWs error:`, err.message);
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, "CDP target error");
    };
    targetWs.onclose = () => {
      console.log(`[CDP] targetWs closed`);
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    };
    clientWs.on("message", (data, isBinary) => {
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(data, { binary: isBinary });
      } else if (targetWs.readyState === WebSocket.CONNECTING) {
        queue.push({ data, isBinary });
      }
    });
    clientWs.on("close", () => {
      console.log(`[CDP] clientWs closed`);
      targetWs.close();
    });
    clientWs.on("error", (err) => {
      console.error(`[CDP] clientWs error:`, err);
      targetWs.close();
    });
  }
}
