# BotZVN Manager

> 🇻🇳 [Đọc bằng tiếng Việt](./README.vi.md)

Web-based browser profile manager for BotZVN — create, manage, and launch browser profiles with advanced fingerprint spoofing.

---

## Table of Contents

- [For End Users](#for-end-users)
  - [Requirements](#requirements)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Environment Variables](#environment-variables)
  - [Data Structure](#data-structure)
- [For Developers](#for-developers)
  - [Development Requirements](#development-requirements)
  - [Project Structure](#project-structure)
  - [Installation](#installation)
  - [Running in Dev Mode](#running-in-dev-mode)

---

## For End Users

### Requirements

- Docker Engine 24+ (or Docker Desktop)
- A BotZVN token (`BOTZVN_TOKEN`) (Optional, defaults to local fallback token)

### Quick Start with Docker

```bash
docker run -d \
  --name botzvn \
  --platform linux/amd64 \
  -p 8080:8080 \
  --shm-size 1g \
  -v botzvn-data:/data \
  botzvn/browser-aio:latest
```

Access the management UI at: **http://localhost:8080**

> **Note:** The `--platform linux/amd64` flag is required on hosts with non-x86_64/amd64 CPU architectures (e.g. Apple Silicon M1/M2/M3, AWS Graviton). It is not needed on standard x86_64/amd64 machines.

### Running with Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  botzvn:
    image: botzvn/browser-aio:latest
    platform: linux/amd64
    container_name: botzvn
    restart: unless-stopped
    ports:
      - "8080:8080"
    shm_size: 1g
    volumes:
      - ./data:/data
    environment:
      - BOTZVN_TOKEN=${BOTZVN_TOKEN}
```

Create a `.env` file:

```env
BOTZVN_TOKEN=<your_token>
```

Start the service:

```bash
docker compose up -d
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BOTZVN_TOKEN` | *(optional)* | BotZVN token used to authenticate when launching browsers (has built-in default) |
| `PORT` / `MANAGER_PORT` | `8080` | HTTP server port |
| `MANAGER_DATA_DIR` | `.botzvn-manager` | Root data directory |
| `PROFILES_DIR` | `.botzvn-manager/profiles` | Browser profile storage directory |
| `LOGS_DIR` | `.botzvn-manager/logs` | Profile session log directory |
| `SQLITE_FILE` | `.botzvn-manager/botzvn-manager.db` | SQLite database path |
| `DATABASE_CLIENT` | *(empty)* | Database client (`pg` for PostgreSQL) |
| `DATABASE_URL` | *(empty)* | PostgreSQL connection URL (optional, replaces SQLite) |
| `SCREEN_WIDTH` | `1365` | Default browser screen width |
| `SCREEN_HEIGHT` | `768` | Default browser screen height |
| `CDP_PORT_BASE` | `9300` | Starting CDP port (range: 9300–9499) |
| `VNC_PORT_BASE` | `5900` | Starting VNC port (range: 5900–6099) |
| `VIEW_IDLE_MS` | `30000` | Idle timeout before closing a VNC view (ms) |
| `BROWSER_PATH` | `bin/botzvn` | Path to the Chromium binary |

### Data Structure

Data is stored in the `.botzvn-manager/` directory (or mounted as `/data` volume in Docker):

```
.botzvn-manager/
├── botzvn-manager.db     ← SQLite database (profiles, sessions)
├── database-setup.json   ← First-run setup state
├── profiles/             ← Chrome user-data-dir for each profile
│   └── <profile-id>/     ← Created automatically on first browser launch
├── logs/                 ← Browser session log files
└── runtime/              ← Runtime state (PIDs, ports, etc.)
```

---

## For Developers

### Development Requirements

- **Node.js** 20.19+ (see `.nvmrc`)
- **pnpm** 10+ (`npm install -g pnpm`)
- **nvm** (recommended for Node.js version management)
- BotZVN Chromium Linux x64 binary (contact the team)

### Project Structure

```
browser-manager/
├── apps/
│   ├── api/                  ← Entry point: Express API server
│   │   ├── src/server.js     ← Main entry point
│   │   ├── .env.example      ← Environment variable template
│   │   └── package.json
│   └── web/                  ← Entry point: React/Vite frontend
│       ├── src/main.tsx      ← Main entry point
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── backend/              ← Shared backend logic
│   │   └── src/
│   │       ├── server.js
│   │       ├── config.js     ← Environment variable reader
│   │       ├── database.js   ← SQLite/PostgreSQL setup
│   │       ├── context.js    ← Runtime context (VNC, CDP bridges)
│   │       ├── modules/
│   │       │   ├── profiles/ ← Profile CRUD
│   │       │   ├── groups/   ← Groups CRUD
│   │       │   ├── proxy/    ← Proxy management
│   │       │   └── setup/    ← Setup wizard
│   │       ├── proxy/        ← CDP & VNC WebSocket proxy
│   │       ├── runtime/      ← Browser process manager
│   │       ├── middleware/
│   │       └── utils/
│   └── frontend/             ← Shared UI components & logic
│       └── src/
│           ├── features/     ← Feature modules (profiles, groups...)
│           ├── components/   ← Shared UI components
│           ├── lib/          ← i18n, api client, utilities
│           └── locales/      ← Translation files
│               ├── vi/       ← Vietnamese (vi)
│               └── en/       ← English (en)
│
├── dev.sh                    ← Dev environment startup script
├── package.json              ← Workspace root
└── pnpm-workspace.yaml
```

### Installation

**1. Clone the repo and install dependencies:**

```bash
git clone <repo-url> browser-manager
cd browser-manager
./dev.sh setup
```

The `setup` command will automatically:
- Copy `.env.example` to `.env` if not already present
- Run `pnpm install`
- Build the `better-sqlite3` native addon

**2. Configure `.env`:**

```bash
# apps/api/.env
BOTZVN_TOKEN=<your_token>
BROWSER_PATH=/path/to/botzvn   # Path to the Chromium binary
```

### Running in Dev Mode

```bash
# Start both API and Web dev servers
./dev.sh

# Start API server only (port 8080)
./dev.sh api

# Start Web dev server only (port 5173)
./dev.sh web
```

| Server | URL | Description |
|---|---|---|
| API | http://localhost:8080 | Express REST API + WebSocket |
| Web | http://localhost:5173 | Vite dev server (hot reload) |

The script automatically:
- Loads nvm and the correct Node.js version from `.nvmrc`
- Creates `.env` from `.env.example` if not present
- Rebuilds native addons if needed
- Frees occupied ports before starting
