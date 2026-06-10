#!/usr/bin/env bash
# dev.sh — Auto-configure and start BotZVN Manager Core (browser-manager) for local development.
#
# Usage:
#   ./dev.sh            — start both API and Web dev servers (default)
#   ./dev.sh api        — start API server only
#   ./dev.sh web        — start Web server only
#   ./dev.sh setup      — only install deps / rebuild native addons, then exit
#
# This script is safe to re-run. It will:
#   1. Load nvm / set up PATH so pnpm and node are available.
#   2. Create .env files from .env.example if not present.
#   3. Run pnpm install if node_modules is missing.
#   4. Rebuild native addons (better-sqlite3) if the .node binding is missing.
#   5. Start the requested servers in the foreground (with cleanup on exit).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-both}"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[dev]${NC} $*"; }
success() { echo -e "${GREEN}[dev]${NC} $*"; }
warn()    { echo -e "${YELLOW}[dev]${NC} $*"; }
error()   { echo -e "${RED}[dev]${NC} $*" >&2; }

# ── 0. Ensure nvm and pnpm are available ─────────────────────────────────────
# Load nvm — this sets up PATH, node, npm in the current shell
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"  # loads nvm with full PATH setup
  # Use the version from .nvmrc if present, otherwise fall back to nvm default
  NVMRC="$DIR/.nvmrc"
  if [[ -f "$NVMRC" ]]; then
    NODE_VERSION="$(cat "$NVMRC" | tr -d '[:space:]')"
    nvm use "$NODE_VERSION" 2>/dev/null || nvm install "$NODE_VERSION"
  fi
  info "Using Node.js $(node --version) via nvm"
fi

# Verify pnpm is available (usually lives in nvm's node bin after nvm use)
if ! command -v pnpm &>/dev/null; then
  # Fallback: check common pnpm global locations
  for _pnpm_dir in \
    "${PNPM_HOME:-}" \
    "$HOME/.local/share/pnpm" \
    "$HOME/Library/pnpm" \
    "/opt/homebrew/bin" \
    "/usr/local/bin"; do
    if [[ -n "$_pnpm_dir" && -x "$_pnpm_dir/pnpm" ]]; then
      export PATH="$_pnpm_dir:$PATH"
      break
    fi
  done
fi

if ! command -v pnpm &>/dev/null; then
  error "pnpm not found. Install it: npm install -g pnpm"
  exit 1
fi
info "Using pnpm $(pnpm --version) / Node $(node --version)"


# ── 1. Create .env files from .env.example ───────────────────────────────────
create_env_if_missing() {
  local example="$1" target="$2"
  if [[ ! -f "$target" ]]; then
    if [[ -f "$example" ]]; then
      cp "$example" "$target"
      info "Created $target"
    else
      warn "No .env.example found at $example, skipping"
    fi
  fi
}

create_env_if_missing "$DIR/apps/api/.env.example" "$DIR/apps/api/.env"
create_env_if_missing "$DIR/apps/web/.env.example" "$DIR/apps/web/.env"

# ── 2. Install dependencies if needed ────────────────────────────────────────
SQLITE_BINDING="$DIR/node_modules/.pnpm/better-sqlite3@12.10.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node"

if [[ ! -d "$DIR/node_modules" ]]; then
  info "node_modules not found, running pnpm install..."
  cd "$DIR"
  pnpm install
  success "Dependencies installed."
fi

# ── 3. Rebuild native addon if .node binding is missing ──────────────────────
if [[ ! -f "$SQLITE_BINDING" ]]; then
  info "better-sqlite3 native binding not found, rebuilding..."
  cd "$DIR"
  pnpm rebuild better-sqlite3
  success "better-sqlite3 rebuilt successfully."
else
  info "better-sqlite3 binding OK."
fi

if [[ "$MODE" == "setup" ]]; then
  success "Setup complete. Run './dev.sh' to start servers."
  exit 0
fi

# ── 4. Free ports before starting ────────────────────────────────────────────
kill_port() {
  local port="$1"
  local max_attempts=5
  local attempt=0
  while [[ $attempt -lt $max_attempts ]]; do
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [[ -z "$pids" ]]; then
      return 0  # port is free
    fi
    attempt=$((attempt + 1))
    warn "Port $port in use (PID $pids), killing... [attempt $attempt/$max_attempts]"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  done
  warn "Could not free port $port after $max_attempts attempts, continuing anyway..."
}

if [[ "$MODE" == "both" || "$MODE" == "api" ]]; then
  kill_port 8080
fi
if [[ "$MODE" == "both" || "$MODE" == "web" ]]; then
  kill_port 5173
fi

# ── 5. Start servers ─────────────────────────────────────────────────────────
cd "$DIR"

API_PID=""
WEB_PID=""

cleanup() {
  info "Shutting down..."
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "$WEB_PID" ]] && kill "$WEB_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  info "Done."
}
trap cleanup EXIT INT TERM

if [[ "$MODE" == "both" || "$MODE" == "api" ]]; then
  info "Starting API server  →  http://localhost:8080"
  BOTZVN_EDITION=core pnpm --filter @botzvn/api dev &
  API_PID=$!
fi

if [[ "$MODE" == "both" || "$MODE" == "web" ]]; then
  [[ "$MODE" == "both" ]] && sleep 1  # give API a moment first
  info "Starting Web server  →  http://localhost:5173"
  BOTZVN_EDITION=core BOTZVN_RUNTIME=web pnpm --filter @botzvn/web dev &
  WEB_PID=$!
fi

success "Dev servers running. Press Ctrl+C to stop."
wait

