import express from "express";
import path from "node:path";
import { createRequire } from "node:module";

import { createCdpRouter } from "./proxy/cdp-proxy.js";
import { requireDatabase } from "./middleware/db.middleware.js";
import { vncBridge as defaultVncBridge, cdpBridge as defaultCdpBridge, runtimeManager as defaultRuntimeManager } from "./context.js";

import setupRoutes from "./modules/setup/setup.routes.js";
import profileRoutes from "./modules/profiles/profiles.routes.js";
import proxyRoutes from "./modules/proxy/proxy.routes.js";
import groupRoutes from "./modules/groups/groups.routes.js";

/**
 * Tạo Express app với Core routes + Pro plugins cắm vào.
 *
 * @param {Object} options
 * @param {import('express').RequestHandler[]} [options.globalMiddleware=[]]
 *   Middleware chạy trước mọi route (vd: Pro auth middleware)
 * @param {Array<{path: string, router: import('express').Router, overridesCore?: boolean}>} [options.routePlugins=[]]
 *   Routes Pro muốn thêm hoặc override.
 *   overridesCore=true → mount TRƯỚC Core routes (Express dùng handler đầu tiên match)
 *   overridesCore=false → mount SAU Core routes (additive)
 * @param {Object} [options.routeMiddleware={}]
 *   Middleware cắm vào các Core router cụ thể (vd: { profiles: [requireAuth] })
 */
export function createApp(options = {}) {
  const { 
    globalMiddleware = [], 
    routePlugins = [], 
    routeMiddleware = {},
    runtimeManager = defaultRuntimeManager,
    vncBridge = defaultVncBridge,
    cdpBridge = defaultCdpBridge
  } = options;
  const app = express();

  const require = createRequire(import.meta.url);
  const mainFilePath = require.resolve("@novnc/novnc");
  const novncPath = mainFilePath.slice(0, mainFilePath.lastIndexOf("@novnc/novnc") + "@novnc/novnc".length);

  app.use(express.json({ limit: "2mb" }));
  app.use("/vendor/novnc", express.static(novncPath));
  app.use(express.static(path.resolve("public")));

  // 1. Global middleware từ Pro (vd: auth, logging, rate limiting)
  for (const mw of globalMiddleware) {
    app.use(mw);
  }

  // 2. Pro routes cần override Core (mount trước)
  for (const ext of routePlugins.filter((e) => e.overridesCore)) {
    app.use(ext.path, ext.router);
  }

  // 3. Core routes
  app.use("/api", setupRoutes);
  
  const profileMws = [requireDatabase, ...(routeMiddleware.profiles || [])];
  app.use("/api/profiles", ...profileMws, profileRoutes);
  
  const proxyMws = [requireDatabase, ...(routeMiddleware.proxy || [])];
  app.use("/api/proxy", ...proxyMws, proxyRoutes);
  
  const groupMws = [requireDatabase, ...(routeMiddleware.groups || [])];
  app.use("/api/groups", ...groupMws, groupRoutes);
  
  createCdpRouter(app, runtimeManager);

  // 5. Pro routes additive (mount sau)
  for (const ext of routePlugins.filter((e) => !e.overridesCore)) {
    app.use(ext.path, ext.router);
  }

  // 6. 404 Handler
  if (options.notFoundHandler) {
    app.use(options.notFoundHandler);
  } else {
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        res.status(404).json({ error: "Route not found" });
      } else {
        next();
      }
    });
  }

  // 7. Error handler
  if (options.errorHandler) {
    app.use(options.errorHandler);
  } else {
    // eslint-disable-next-line no-unused-vars
    app.use((error, req, res, next) => {
      const status = error.statusCode || 500;
      if (status >= 500) console.error(error);
      res.status(status).json({ error: error.message || "Internal server error" });
    });
  }

  return { app, runtimeManager, vncBridge, cdpBridge };
}
