#!/usr/bin/env bash
# build-image-core.sh — Build the BotZVN Manager core Docker image.
#
# Usage:
#   ./scripts/build-image.sh [tag]          # e.g. ./scripts/build-image.sh 1.0.0
#
# Requirements:
#   - Docker Engine 24+ with BuildKit (or Docker Desktop / OrbStack)
#   - BotZVN Linux x64 binary bundle placed in ./browser/
#     Either:
#       • Extracted:  ./browser/botzvn  (+ chrome_crashpad_handler, *.pak, ...)
#       • Tarball:    ./browser/botzvn-linux-x64.tar.gz  (auto-extracted below)
#
# Optional environment variables:
#   IMAGE                Full image name      (default: botzvn/browser-aio:TAG)
#   BOTZVN_CHROMIUM_DIR  Path to browser dir  (default: ./browser)
#   NO_PUSH              Set to "1" to skip the push prompt after build
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
BROWSER_DIR="${BOTZVN_CHROMIUM_DIR:-$DIR/browser}"

# ── Tag ───────────────────────────────────────────────────────────────────────
if [[ -n "${1:-}" ]]; then
  TAG="$1"
else
  read -rp "Enter image tag [latest]: " TAG
  TAG="${TAG:-latest}"
fi

IMAGE="${IMAGE:-botzvn/browser-aio:$TAG}"

mkdir -p "$BROWSER_DIR"

# ── Check or auto-extract binary ─────────────────────────────────────────────
if [[ ! -x "$BROWSER_DIR/botzvn" ]]; then
  if ls "$BROWSER_DIR"/*.tar.gz 1>/dev/null 2>&1; then
    echo "[build-image] Found .tar.gz — auto-extracting..."
    tar -xzf "$BROWSER_DIR"/*.tar.gz -C "$BROWSER_DIR"
  fi
fi

if [[ ! -x "$BROWSER_DIR/botzvn" ]]; then
  echo "" >&2
  echo "Error: BotZVN Linux x64 binary not found at $BROWSER_DIR/botzvn" >&2
  echo "" >&2
  echo "Please place the BotZVN Linux x64 bundle inside ./browser/," >&2
  echo "or set BOTZVN_CHROMIUM_DIR to point to an existing bundle:" >&2
  echo "  BOTZVN_CHROMIUM_DIR=/path/to/browser ./scripts/build-image.sh" >&2
  echo "" >&2
  echo "Bundle contents needed: botzvn, chrome_crashpad_handler, *.pak, ..." >&2
  echo "Or place a tarball botzvn-linux-x64.tar.gz (auto-extracted on next run)." >&2
  exit 1
fi

# ── Build ─────────────────────────────────────────────────────────────────────
echo "[build-image] Building image: $IMAGE"
echo "[build-image] Chromium:       $BROWSER_DIR/botzvn"
echo ""

docker build \
  --platform linux/amd64 \
  --build-context chromium_bin="$BROWSER_DIR" \
  --build-arg BOTZVN_EDITION=core \
  --build-arg BOTZVN_RUNTIME_BASE=ubuntu:22.04 \
  -f "$DIR/docker/Dockerfile" \
  -t "$IMAGE" \
  "$DIR"

echo ""
echo "✅ Build complete! Image: $IMAGE"
echo ""
if [[ "${NO_PUSH:-}" != "1" ]]; then
  read -rp "Push to Docker Hub? [y/N]: " PUSH
  if [[ "${PUSH,,}" == "y" ]]; then
    docker push "$IMAGE"
    echo "✅ Pushed: $IMAGE"
  fi
fi
