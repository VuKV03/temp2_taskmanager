# Development Guide

## Overview

| Item | Value |
|------|-------|
| Repo layout | Monorepo (`backend-nest/`, `frontend-react/`, `v1-docs/`) |
| Node.js | 20 LTS |
| Package manager | npm |
| Database | MySQL 8.x (Docker) |
| Cache / Queue | Redis 7 (Docker) |
| Object storage | MinIO (Docker, S3-compatible) |

---

## Prerequisites

| Tool | Version | Kiểm tra |
|------|---------|----------|
| Node.js | ≥ 20.11 | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Docker | ≥ 24 | `docker -v` |
| Docker Compose | v2 | `docker compose version` |
| Git | ≥ 2.40 | `git --version` |

*Không cần cài MySQL/Redis trực tiếp trên máy — Docker lo hết.*

---

## Repo Structure

```
task-manager/
├── v1-docs/                    # Tài liệu dùng chung
│   ├── DATABASE.md
│   ├── API_SPEC.md
│   ├── UI-SPEC.md
│   └── DEVELOPMENT.md
├── backend-nest/
│   ├── src/
│   ├── docs/                   # BE-ARCHITECTURE.md, BE-PROJECT-RULES.md
│   ├── .env.example
│   └── package.json
├── frontend-react/
│   ├── src/
│   ├── docs/                   # FE-ARCHITECTURE.md, FE-PROJECT-RULES.md
│   ├── .env.example
│   └── package.json
├── .claude/skills/             # be-crud, fe-crud
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## First-Time Setup

```bash
# 1. Clone
git clone <repo-url> task-manager
cd task-manager

# 2. Khởi động hạ tầng (MySQL + Redis + MinIO)
docker compose up -d
docker compose ps            # cả 3 service phải ở trạng thái healthy

# 3. Backend
cd backend-nest
cp .env.example .env         # sửa secret nếu cần
npm install
npm run migration:run        # tạo bảng
npm run seed                 # tạo role + tài khoản admin mặc định
npm run start:dev            # http://localhost:3000/api/docs

# 4. Frontend (terminal khác)
cd ../frontend-react
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

**Tài khoản seed mặc định:**

| Email | Password | Role |
|-------|----------|------|
| `admin@local.dev` | `Admin@12345` | admin |
| `member@local.dev` | `Member@12345` | member |

*Chỉ dùng cho môi trường local. Seed phải từ chối chạy khi `NODE_ENV=production`.*

---

## docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: tm-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: taskmanager
      TZ: UTC
    command: --default-time-zone=+00:00
    ports:
      - '3306:3306'
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-psecret']
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: tm-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: tm-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'   # API
      - '9001:9001'   # Console
    volumes:
      - minio-data:/data

volumes:
  mysql-data:
  redis-data:
  minio-data:
```

**`--default-time-zone=+00:00` là bắt buộc.** Toàn hệ thống lưu UTC; nếu MySQL chạy theo giờ máy thì mốc "hôm nay" sẽ lệch.

---

## Environment Variables

### backend-nest/.env.example

```bash
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=taskmanager

JWT_ACCESS_SECRET=change-me-at-least-32-characters-long
JWT_REFRESH_SECRET=change-me-too-and-different-from-above
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

STORAGE_DRIVER=s3
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=task-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
CORS_ORIGINS=http://localhost:5173
```

### frontend-react/.env.example

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**Quy tắc:** `.env` không bao giờ vào Git. Khi thêm biến mới, cập nhật `.env.example` **trong cùng commit** — nếu không, đồng đội pull về sẽ crash lúc khởi động do Joi validate thiếu biến.

---

## npm Scripts

### backend-nest

| Script | Việc |
|--------|------|
| `npm run start:dev` | Chạy API, watch mode |
| `npm run start:worker` | Chạy worker (cron + queue) riêng |
| `npm run build` | Build production |
| `npm run migration:generate -- src/database/migrations/<name>` | Sinh migration từ entity |
| `npm run migration:create -- src/database/migrations/<name>` | Tạo migration rỗng (viết tay) |
| `npm run migration:run` | Chạy migration |
| `npm run migration:revert` | Rollback 1 migration gần nhất |
| `npm run seed` | Seed role + tài khoản mặc định |
| `npm run test` | Unit test |
| `npm run test:e2e` | E2E test |
| `npm run lint` | ESLint + fix |

### frontend-react

| Script | Việc |
|--------|------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + build |
| `npm run preview` | Xem thử bản build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint + fix |
| `npm run api:types` | Sinh type từ OpenAPI của BE |

---

## Migration Workflow

```bash
# 1. Sửa entity trong src/features/*/entities/
# 2. Sinh migration
npm run migration:generate -- src/database/migrations/add-recurrence-to-tasks

# 3. MỞ FILE RA ĐỌC — bắt buộc
#    - Có đủ up() và down() chưa?
#    - down() có làm mất dữ liệu không?
#    - Có lệnh DROP nào ngoài dự kiến không?

# 4. Chạy
npm run migration:run

# 5. Thử rollback ngay trên máy local
npm run migration:revert && npm run migration:run
```

**Quy tắc:**
- `synchronize` luôn `false`, kể cả ở local
- Migration đã push lên nhánh chung thì **không sửa** — viết migration mới
- Đổi tên cột: dùng 3 bước (thêm cột mới → copy dữ liệu → xoá cột cũ), không `RENAME` trực tiếp khi bảng đã có dữ liệu thật
- Bước 5 là bắt buộc: `down()` không chạy được chỉ lộ ra khi bạn thử

---

## Daily Workflow

```bash
# Đầu ngày
git pull origin develop
docker compose up -d
cd backend-nest && npm install && npm run migration:run
cd ../frontend-react && npm install

# Làm một feature
git checkout -b feature/task-today-view
# ... code ...
npm run lint && npm run test
git commit -m "feat: add today view with timezone-aware date range"
git push -u origin feature/task-today-view
# → mở PR vào develop
```

**Thứ tự làm một feature:** BE trước, FE sau.

1. Cập nhật `DATABASE.md` + `API_SPEC.md` nếu có thay đổi hợp đồng
2. `/be-crud <feature>` → entity, DTO, service, controller, migration
3. Test bằng Swagger tại `/api/docs`
4. `npm run api:types` ở FE để lấy type mới
5. `/fe-crud <feature>` → service, hook, component, page
6. Kiểm tra 3 trạng thái: loading / error / empty

---

## Git Workflow

```
main       ← chỉ nhận merge từ develop, mỗi lần merge = 1 release
develop    ← nhánh tích hợp
feature/*  ← nhánh làm việc
fix/*
```

| Loại | Ví dụ nhánh | Ví dụ commit |
|------|-------------|--------------|
| Tính năng | `feature/task-today-view` | `feat: add today view` |
| Sửa lỗi | `fix/status-toggle-rollback` | `fix: rollback optimistic update on error` |
| Refactor | `refactor/task-status-machine` | `refactor: extract status transition` |
| Tài liệu | `docs/update-api-spec` | `docs: add recurrence rule to task spec` |

### PR Checklist

- [ ] Lint và test pass
- [ ] Không còn `console.log`, không còn `any`
- [ ] Migration có cả `up()` và `down()`, đã thử revert
- [ ] `.env.example` cập nhật nếu thêm biến mới
- [ ] `API_SPEC.md` cập nhật nếu đổi request/response
- [ ] `CONTEXT.md` của feature cập nhật nếu đổi nghiệp vụ
- [ ] Ảnh chụp màn hình nếu đổi giao diện
- [ ] 1+ người review

---

## Code Quality

```bash
# Cài một lần
npx husky init
```

| Hook | Chạy gì |
|------|---------|
| `pre-commit` | `lint-staged` — ESLint + Prettier trên file đã stage |
| `commit-msg` | `commitlint` — kiểm tra định dạng commit |
| `pre-push` | `npm run test` |

Cấu hình dùng chung: ESLint (`@typescript-eslint`), Prettier (`printWidth: 100`, `singleQuote: true`), TypeScript `strict: true` ở cả hai phía.

---

## Troubleshooting

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|------------|
| `ECONNREFUSED 3306` | Container MySQL chưa healthy | `docker compose ps`, đợi healthcheck xanh |
| App crash lúc khởi động, log nhắc tên biến | Thiếu biến trong `.env` | Đối chiếu `.env.example` |
| Migration báo "No changes in database schema" | Entity chưa đăng ký trong DataSource | Kiểm tra `entities` trong `typeorm.config.ts` |
| Ngày task lệch 7 tiếng | MySQL không chạy UTC | Kiểm tra `--default-time-zone=+00:00` |
| 401 liên tục sau khi login | Cookie refresh token bị chặn | Bật `credentials: true` ở cả axios và CORS |
| CORS error trên trình duyệt | `CORS_ORIGINS` thiếu port FE | Thêm `http://localhost:5173` |
| Upload lỗi 403 | Bucket MinIO chưa tạo | Vào `localhost:9001` tạo bucket `task-attachments` |
| Cron chạy 2 lần | Nhiều instance cùng chạy scheduler | Chỉ bật scheduler ở worker process |
| FE gọi API 404 | Thiếu `/api/v1` trong base URL | Kiểm tra `VITE_API_BASE_URL` |

---

## Reset Environment

```bash
# Xoá sạch dữ liệu, dựng lại từ đầu
docker compose down -v
docker compose up -d
cd backend-nest && npm run migration:run && npm run seed
```

*`-v` xoá cả volume. Chỉ dùng ở local.*
