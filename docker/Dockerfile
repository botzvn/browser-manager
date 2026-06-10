# BotZVN Manager — Dockerfile
# Build: docker build --build-context chromium_bin=./browser -t botzvn/browser-manager:latest .

# ── Stage 1: Build frontend & install all workspace deps ─────────────────────
FROM node:20-bookworm-slim AS frontend-build

WORKDIR /repo

# Copy workspace manifests first (maximises layer-cache reuse)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages

# python3 + make + g++ are required by node-gyp to compile better-sqlite3
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/web ./apps/web

RUN BOTZVN_EDITION=core BOTZVN_RUNTIME=web pnpm --filter @botzvn/web build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    MANAGER_DATA_DIR=/data \
    PROFILES_DIR=/data/profiles \
    LOGS_DIR=/data/logs \
    BROWSER_PATH=/chromium/botzvn

# Install Node.js 20, Xvfb, x11vnc, and fonts
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl gnupg \
        xvfb x11vnc \
        fonts-liberation fonts-noto-color-emoji \
    && if ! command -v node >/dev/null 2>&1; then \
         curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
         && apt-get install -y --no-install-recommends nodejs; \
       fi \
    && npm install -g corepack \
    && corepack enable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

COPY --from=frontend-build /repo/package.json /repo/pnpm-lock.yaml /repo/pnpm-workspace.yaml ./
COPY --from=frontend-build /repo/node_modules ./node_modules
COPY --from=frontend-build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=frontend-build /repo/packages ./packages
COPY apps/api ./apps/api
COPY --from=frontend-build /repo/apps/web/dist ./apps/api/public

# Copy BotZVN Chromium binary bundle (passed via --build-context chromium_bin=...)
COPY --from=chromium_bin . /chromium/
RUN chmod +x /chromium/botzvn /chromium/chrome_crashpad_handler 2>/dev/null || true

VOLUME /data
EXPOSE 8080

WORKDIR /repo/apps/api

CMD ["node", "src/server.js"]
