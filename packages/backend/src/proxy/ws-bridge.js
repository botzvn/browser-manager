import net from "node:net";
import WebSocket, { WebSocketServer } from "ws";

export class VncWsBridge {
  constructor(runtimeManager) {
    this.runtimeManager = runtimeManager;
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on("connection", (ws, request, runtime) => {
      this.bridge(ws, runtime);
    });
  }

  handleUpgrade(request, socket, head) {
    const url = new URL(request.url, "http://localhost");
    const match = url.pathname.match(/^\/api\/profiles\/([^/]+)\/vnc$/);
    if (!match) return false;
    const profileId = decodeURIComponent(match[1]);
    const runtime = this.runtimeManager.get(profileId);
    if (!runtime?.viewer) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return true;
    }
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit("connection", ws, request, runtime);
    });
    return true;
  }

  bridge(ws, runtime) {
    const tcp = net.connect({ host: "127.0.0.1", port: runtime.viewer.vncPort });
    tcp.on("data", (chunk) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    });
    tcp.on("error", () => {
      if (ws.readyState === WebSocket.OPEN) ws.close(1011, "VNC TCP error");
    });
    tcp.on("close", () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });
    ws.on("message", (data) => {
      if (tcp.writable) tcp.write(Buffer.from(data));
    });
    ws.on("close", () => tcp.destroy());
    ws.on("error", () => tcp.destroy());
  }
}
