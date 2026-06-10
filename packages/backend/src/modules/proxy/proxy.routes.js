import { Router } from "express";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { asyncHandler } from "../../utils/http.js";
import { proxiesRepository } from "../../context.js";

const router = Router();

const GEO_CHECK_URL = "https://get.geojs.io/v1/ip/geo.json";
const TIMEOUT_MS = 12_000;

import https from "node:https";

async function performProxyCheck(params) {
  const { proxy_type = "http", proxy_host, proxy_port, proxy_username = "", proxy_password = "" } = params || {};

  if (!proxy_host || !proxy_port) {
    throw new Error("Missing proxy_host or proxy_port");
  }

  const port = Number(proxy_port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid proxy_port");
  }

  const encodedUser = proxy_username ? encodeURIComponent(proxy_username) : "";
  const encodedPass = proxy_password ? encodeURIComponent(proxy_password) : "";
  const auth = encodedUser ? `${encodedUser}:${encodedPass}@` : "";
  const scheme = proxy_type.toLowerCase() === "socks5" ? "socks5" : proxy_type.toLowerCase() === "socks4" ? "socks4" : "http";
  const proxyUrl = `${scheme}://${auth}${proxy_host}:${port}`;

  let agent;
  if (scheme === "socks5" || scheme === "socks4") {
    agent = new SocksProxyAgent(proxyUrl);
  } else {
    agent = new HttpsProxyAgent(proxyUrl);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Proxy timeout"));
    }, TIMEOUT_MS);

    const req = https.get(GEO_CHECK_URL, {
      agent,
      headers: { "User-Agent": "botzvn-proxy-checker/1.0" },
    }, (res) => {
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        res.resume(); // consume response data to free up memory
        return reject(new Error(`External service returned HTTP ${res.statusCode}`));
      }

      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        clearTimeout(timer);
        try {
          const json = JSON.parse(data);
          resolve({
            ok: true,
            ip: json.ip,
            country: json.country || json.country_code,
            city: json.city,
            org: json.organization_name,
            timezone: json.timezone,
            lat: json.latitude,
            lon: json.longitude,
          });
        } catch (err) {
          reject(new Error("Invalid response from geo service"));
        }
      });
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// GET /api/proxy - Get all proxies
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const list = await proxiesRepository.list();
    res.json(list);
  })
);

// POST /api/proxy - Create multiple proxies
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { proxies } = req.body || {};
    if (!proxies || !Array.isArray(proxies)) {
      return res.status(400).json({ error: "Missing proxies array" });
    }
    const inserted = await proxiesRepository.createMany(proxies);
    res.status(201).json({ success: true, inserted });
  })
);

// PUT /api/proxy/:id - Update proxy
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const success = await proxiesRepository.update(req.params.id, req.body || {});
    if (!success) {
      return res.status(404).json({ error: "Proxy not found" });
    }
    res.json({ success: true });
  })
);

// DELETE /api/proxy/:id - Delete proxy
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const success = await proxiesRepository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Proxy not found" });
    }
    res.json({ success: true });
  })
);

// POST /api/proxy/check - Check proxy (single or bulk)
router.post(
  "/check",
  asyncHandler(async (req, res) => {
    const { proxies } = req.body || {};

    // Bulk check
    if (Array.isArray(proxies)) {
      if (proxies.length === 0) {
        return res.json({ success: true, results: [] });
      }

      const list = await proxiesRepository.getByIds(proxies);
      const results = [];

      await Promise.allSettled(
        list.map(async (proxy) => {
          const startTime = Date.now();
          try {
            const checkResult = await performProxyCheck({
              proxy_type: proxy.type,
              proxy_host: proxy.host,
              proxy_port: proxy.port,
              proxy_username: proxy.username,
              proxy_password: proxy.password,
            });
            const latency = Date.now() - startTime;
            const country_code = checkResult.country || "UNKNOWN";

            await proxiesRepository.update(proxy.id, {
              status: "ACTIVE",
              latency,
              country_code,
            });

            results.push({
              id: proxy.id,
              status: "ACTIVE",
              latency,
              country_code,
            });
          } catch (err) {
            await proxiesRepository.update(proxy.id, {
              status: "DEAD",
              latency: null,
              country_code: null,
            });
            results.push({
              id: proxy.id,
              status: "DEAD",
              error: err.message || "Connection failed",
            });
          }
        })
      );

      return res.json({ success: true, results });
    }

    // Single check (standard payload)
    try {
      const result = await performProxyCheck(req.body);
      res.json(result);
    } catch (err) {
      res.json({ ok: false, error: err.message || "Connection failed" });
    }
  })
);

export default router;
