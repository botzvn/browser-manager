# BotZVN Manager

> 🇬🇧 [Read in English](./README.md)

Trình quản lý browser profile cho BotZVN — giao diện web để tạo, quản lý và chạy các browser profile với fingerprint spoofing nâng cao.

---

## Mục lục

- [Dành cho người dùng cuối](#dành-cho-người-dùng-cuối)
  - [Yêu cầu](#yêu-cầu)
  - [Chạy nhanh với Docker](#chạy-nhanh-với-docker)
  - [Chạy bằng Docker Compose](#chạy-bằng-docker-compose)
  - [Biến môi trường](#biến-môi-trường)
  - [Cấu trúc dữ liệu](#cấu-trúc-dữ-liệu)
- [Dành cho developer](#dành-cho-developer)
  - [Yêu cầu phát triển](#yêu-cầu-phát-triển)
  - [Cấu trúc project](#cấu-trúc-project)
  - [Cài đặt](#cài-đặt)
  - [Chạy dev mode](#chạy-dev-mode)

---

## Dành cho người dùng cuối

### Yêu cầu

- Docker Engine 24+ (hoặc Docker Desktop)
- Token BotZVN (`BOTZVN_TOKEN`) (Tùy chọn, mặc định sử dụng fallback token nội bộ)

### Chạy nhanh với Docker

```bash
docker run -d \
  --name botzvn \
  --platform linux/amd64 \
  -p 8080:8080 \
  --shm-size 1g \
  -v botzvn-data:/data \
  botzvn/browser-aio:latest
```

Truy cập giao diện quản lý tại: **http://localhost:8080**

> **Lưu ý:** Flag `--platform linux/amd64` cần thiết khi chạy trên các thiết bị có CPU khác x86_64/amd64 (ví dụ Apple Silicon M1/M2/M3, AWS Graviton). Trên máy chủ CPU x86_64/amd64 thông thường thì không cần.

### Chạy bằng Docker Compose

Tạo file `docker-compose.yml`:

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

Tạo file `.env`:

```env
BOTZVN_TOKEN=<your_token>
```

Chạy:

```bash
docker compose up -d
```

### Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `BOTZVN_TOKEN` | *(tùy chọn)* | Token BotZVN để xác thực khi mở browser (đã có sẵn mặc định) |
| `PORT` / `MANAGER_PORT` | `8080` | Cổng HTTP server |
| `MANAGER_DATA_DIR` | `.botzvn-manager` | Thư mục lưu toàn bộ dữ liệu |
| `PROFILES_DIR` | `.botzvn-manager/profiles` | Thư mục chứa browser profiles |
| `LOGS_DIR` | `.botzvn-manager/logs` | Thư mục log của các profile |
| `SQLITE_FILE` | `.botzvn-manager/botzvn-manager.db` | Đường dẫn SQLite database |
| `DATABASE_CLIENT` | *(trống)* | Database client (`pg` nếu dùng PostgreSQL) |
| `DATABASE_URL` | *(trống)* | Kết nối PostgreSQL (tùy chọn, thay thế SQLite) |
| `SCREEN_WIDTH` | `1365` | Độ rộng màn hình browser mặc định |
| `SCREEN_HEIGHT` | `768` | Chiều cao màn hình browser mặc định |
| `CDP_PORT_BASE` | `9300` | Cổng CDP bắt đầu (range: 9300–9499) |
| `VNC_PORT_BASE` | `5900` | Cổng VNC bắt đầu (range: 5900–6099) |
| `BROWSER_PATH` | `bin/botzvn` | Đường dẫn tới Chromium binary |
| `VIEW_IDLE_MS` | `30000` | Thời gian idle trước khi đóng VNC view (ms) |

### Cấu trúc dữ liệu

Dữ liệu được lưu trong thư mục `.botzvn-manager/` (hoặc mount volume `/data` khi dùng Docker):

```
.botzvn-manager/
├── botzvn-manager.db     ← SQLite database (profiles, sessions)
├── database-setup.json   ← Trạng thái setup lần đầu
├── profiles/             ← Chrome user-data-dir của từng profile
│   └── <profile-id>/     ← Tạo tự động khi browser chạy lần đầu
├── logs/                 ← Log file của các browser session
└── runtime/              ← Runtime state (PID, ports, v.v.)
```

---

## Dành cho developer

### Yêu cầu phát triển

- **Node.js** 20.19+ (xem file `.nvmrc`)
- **pnpm** 10+ (`npm install -g pnpm`)
- **nvm** (khuyến nghị để quản lý version Node.js)
- Chromium binary BotZVN Linux x64 (liên hệ team để lấy)

### Cấu trúc project

```
browser-manager/
├── apps/
│   ├── api/                  ← Entry point: Express API server
│   │   ├── src/server.js     ← Main entry point
│   │   ├── .env.example      ← Mẫu biến môi trường
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
│   │       ├── config.js     ← Đọc env vars
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
│           └── locales/      ← Translation files (vi/, en/)
│               ├── vi/
│               └── en/
│
├── dev.sh                    ← Script khởi động dev environment
├── package.json              ← Workspace root
└── pnpm-workspace.yaml
```

### Cài đặt

**1. Clone repo và cài dependencies:**

```bash
git clone <repo-url> browser-manager
cd browser-manager
./dev.sh setup
```

Lệnh `setup` sẽ tự động:
- Tạo file `.env` từ `.env.example` nếu chưa có
- Chạy `pnpm install`
- Build native addon `better-sqlite3`

**2. Cấu hình `.env`:**

```bash
# apps/api/.env
BOTZVN_TOKEN=<your_token>
BROWSER_PATH=/path/to/botzvn   # Đường dẫn tới Chromium binary
```

### Chạy dev mode

```bash
# Chạy cả API và Web dev server
./dev.sh

# Chỉ chạy API server (port 8080)
./dev.sh api

# Chỉ chạy Web dev server (port 5173)
./dev.sh web
```

| Server | URL | Mô tả |
|---|---|---|
| API | http://localhost:8080 | Express REST API + WebSocket |
| Web | http://localhost:5173 | Vite dev server (hot reload) |

Script tự động:
- Load nvm và đúng Node.js version từ `.nvmrc`
- Tạo `.env` từ `.env.example` nếu chưa có
- Rebuild native addons nếu cần
- Giải phóng port nếu đang bị chiếm
