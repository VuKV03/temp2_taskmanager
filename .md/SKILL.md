---
name: init-base
description: >
  Setup project architecture and environment for existing backend or frontend.
  Creates folder structure (feature-based), installs dependencies, configures
  environment, and scaffolds the base files that /be-crud and /fe-crud depend on.
  Use when user says "init backend", "init frontend", "setup structure",
  "scaffold project", or "setup environment".
argument-hint: "[frontend|backend]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Setup Project Architecture & Environment

**Scope:** Structure + Dependencies + Configs + Base files. NO feature code.

This skill sets up:
- ✅ Folder structure (feature-based architecture)
- ✅ Dependencies installation
- ✅ Config files (.env, tsconfig, linting, npm scripts)
- ✅ Core/Shared modules (minimal but **runnable**)
- ✅ Base files that `/be-crud` và `/fe-crud` giả định đã tồn tại
- ❌ NOT feature code (use `/be-crud` or `/fe-crud` later)

## Pre-flight Checks

1. **Argument provided?** Must be `frontend` or `backend`
2. **Target directory exists?**
   - Backend: `backend-nest/`
   - Frontend: `frontend-react/`
3. **Project already initialized?** Check for `package.json`
   - If not exists → Error: "Project not found. Create project first."
4. **Backend only — hạ tầng đã chạy chưa?** `docker compose ps`
   - MySQL/Redis chưa healthy → cảnh báo: bước kiểm tra `npm run start:dev` sẽ fail vì TypeORM kết nối ngay lúc boot
5. **Node version?** `node -v` phải ≥ 20.11

---

## Task: Backend Scaffolding

### Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `v1-docs/DATABASE.md` | Database schema, entity definitions, naming conventions |
| `v1-docs/API_SPEC.md` | API endpoints, response envelope, **error codes**, rate limit |
| `v1-docs/DEVELOPMENT.md` | Biến môi trường, npm scripts, migration workflow |
| `backend-nest/docs/BE-PROJECT-RULES.md` | Coding conventions, patterns, anti-patterns |
| `backend-nest/docs/BE-ARCHITECTURE.md` | Folder structure, module organization |

### Workflow

1. Read all docs above to understand project conventions
2. Scan current project to see what already exists
3. **Present plan and wait for confirmation** (Step 3 below — do NOT skip)
4. **Install missing dependencies** (see below)
5. **Create folder structure** as defined in `BE-ARCHITECTURE.md`:
   ```
   src/
   ├── config/          # database, jwt, redis, storage, app + validation.schema.ts
   ├── core/            # database, logger, cache, queue, storage
   ├── shared/          # decorators, filters, guards, interceptors, pipes,
   │                    # constants, utils, dto, exceptions, types
   ├── database/
   │   ├── migrations/  # ⚠ bắt buộc — DEVELOPMENT.md yêu cầu
   │   └── seeds/
   └── features/        # auth, user-management, task-list, task,
                        # collaboration, activity, statistic, notification
   ```
6. **Setup config files**:
   - `.env.example` — copy **đầy đủ** danh sách biến từ `DEVELOPMENT.md`
   - `src/config/validation.schema.ts` — Joi schema, fail-fast khi thiếu biến
   - `src/config/typeorm.config.ts` — DataSource riêng cho TypeORM CLI
   - `.eslintrc` / `.prettierrc` (`printWidth: 100`, `singleQuote: true`)
   - `tsconfig.json`: bật `strict`, path alias `@/*`
7. **Setup core modules** (minimal, ready-to-use):
   - Database module (TypeORM async, `synchronize: false`, `timezone: 'Z'`)
   - Logger module (Pino, `requestId`, redact `password`/`token`/`authorization`/`cookie`)
   - Cache module (Redis), Queue module (BullMQ), Storage module (local | S3)
8. **Setup shared base files** — `/be-crud` giả định các file này đã có:
   - `shared/constants/error-codes.constant.ts` — chép **toàn bộ** bảng error code từ API_SPEC.md
   - `shared/exceptions/app.exception.ts` — `AppException(code, status, details)`
   - `shared/filters/http-exception.filter.ts` — map `AppException` / `ValidationPipe` / lỗi chưa bắt
   - `shared/interceptors/transform.interceptor.ts` — bọc `{ success, data, meta }`
   - `shared/dto/pagination-query.dto.ts` — `page`, `limit` (max 100), `sort`, `order`
   - `shared/utils/date-range.util.ts` — `getDayRange(timezone)` bằng Luxon
   - `shared/decorators/` — `@CurrentUser()`, `@Roles()`, `@Public()`
   - `shared/guards/` — `JwtAuthGuard`, `RolesGuard` (khung, chưa gắn strategy)
   - `shared/types/` — `ApiResponse`, `PaginatedResponse`
9. **Setup seeds**: `role.seed.ts` (`admin`, `member`) + `admin-user.seed.ts`
   - Seed phải **từ chối chạy** khi `NODE_ENV=production`
10. **Update `package.json` scripts** (bắt buộc — thiếu là không chạy được migration):
    ```json
    {
      "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/config/typeorm.config.ts",
      "migration:create": "typeorm-ts-node-commonjs migration:create",
      "migration:run": "typeorm-ts-node-commonjs migration:run -d src/config/typeorm.config.ts",
      "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/config/typeorm.config.ts",
      "seed": "ts-node src/database/seeds/index.ts",
      "start:worker": "nest start --entryFile worker"
    }
    ```
11. **Update `main.ts`**: global prefix `api/v1`, helmet, cookieParser, CORS (`credentials: true`),
    `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`,
    global filter + interceptor, Swagger tại `/api/docs`, `enableShutdownHooks()`
    - **Không** chạy migration trong `main.ts`
12. Keep existing files intact — DO NOT overwrite

**NOT included (do later with `/be-crud`):**
- Entity definitions
- Controllers, Services, Repositories
- Feature-specific code

### Install Missing Dependencies

Check `package.json` and install if not present:

**Core:**
```bash
# Config + validation env
npm install @nestjs/config joi

# Database
npm install @nestjs/typeorm typeorm mysql2

# Validation
npm install class-validator class-transformer

# Auth — ARGON2, KHÔNG dùng bcrypt (xem BE-PROJECT-RULES mục 5)
npm install @nestjs/jwt @nestjs/passport passport passport-jwt argon2
npm install -D @types/passport-jwt

# API docs
npm install @nestjs/swagger

# Security + rate limit
npm install helmet cookie-parser @nestjs/throttler
npm install -D @types/cookie-parser

# Logging
npm install nestjs-pino pino-http pino-pretty

# Cache + Queue + Cron
npm install @nestjs/cache-manager cache-manager cache-manager-redis-yet
npm install @nestjs/bullmq bullmq @nestjs/schedule

# Event (giao tiếp bất đồng bộ giữa feature)
npm install @nestjs/event-emitter

# Timezone
npm install luxon
npm install -D @types/luxon

# File upload (S3-compatible / MinIO)
npm install @aws-sdk/client-s3 multer
npm install -D @types/multer
```

**Dev:**
```bash
npm install -D @nestjs/testing supertest @types/supertest
npm install -D eslint prettier eslint-config-prettier @typescript-eslint/eslint-plugin
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

**Before installing:**
- Read `package.json` first
- Only install what's missing
- List what will be installed and ask user to confirm

### Validation

- [ ] Folder structure matches `BE-ARCHITECTURE.md` (có cả `src/database/migrations/`)
- [ ] All required dependencies installed
- [ ] `.env.example` đủ mọi biến trong `DEVELOPMENT.md`
- [ ] Joi schema fail-fast: xoá 1 biến bắt buộc → app crash với thông báo rõ tên biến
- [ ] `src/config/typeorm.config.ts` tồn tại, `npm run migration:create -- src/database/migrations/test` chạy được
- [ ] `error-codes.constant.ts` khớp bảng trong `API_SPEC.md`
- [ ] Global filter/interceptor registered trong `main.ts`
- [ ] `docker compose up -d` rồi `npm run start:dev` → server khởi động không lỗi
- [ ] Mở `/api/docs` thấy Swagger UI
- [ ] Project sẵn sàng thêm feature bằng `/be-crud`

---

## Task: Frontend Scaffolding

### Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `v1-docs/API_SPEC.md` | Endpoints, response envelope, **error codes** để map message |
| `v1-docs/UI-SPEC.md` | Design token (màu, typography, spacing), layout, component states |
| `v1-docs/DEVELOPMENT.md` | Biến môi trường, npm scripts |
| `frontend-react/docs/FE-PROJECT-RULES.md` | Coding conventions, state management rules |
| `frontend-react/docs/FE-ARCHITECTURE.md` | Folder structure, query key conventions |

### Workflow

1. Read all docs above to understand project conventions
2. Scan current project to see what already exists
3. **Present plan and wait for confirmation** (Step 3 below — do NOT skip)
4. **Install missing dependencies** (see below)
5. **Create folder structure** as defined in `FE-ARCHITECTURE.md`:
   ```
   src/
   ├── config/
   ├── routes/          # index.tsx, routes.ts, ProtectedRoute, AdminRoute
   ├── layouts/         # MainLayout, AuthLayout, AdminLayout
   ├── shared/
   │   ├── components/  # ui, feedback, layout
   │   ├── hooks/
   │   ├── lib/         # axios, queryClient, datetime
   │   ├── constants/   # error-messages, page size
   │   ├── types/
   │   └── utils/
   └── features/        # auth, task-list, task, activity,
                        # statistic, notification, user-management
   ```
6. **Setup config files**:
   - `.env.example` với `VITE_API_BASE_URL`
   - Tailwind: **v4** dùng `@tailwindcss/vite` + `@theme` trong CSS (không có `tailwind.config.js`).
     Nếu dự án đang ở v3 thì giữ `tailwind.config.js` — kiểm tra `package.json` trước, đừng chạy `npx tailwindcss init -p` một cách mù quáng
   - **Nhập design token từ `UI-SPEC.md`** vào theme: `primary`, `surface`, `background`,
     màu theo status/priority, font Inter + JetBrains Mono, radius, spacing
   - Path alias `@/*` trong `tsconfig.json` **và** `vite.config.ts`
7. **Setup shared base files** — `/fe-crud` giả định các file này đã có:
   - `shared/lib/axios.ts` — request gắn Bearer; response bóc `data.data`;
     401 → gọi refresh **một lần** (queue các request còn lại), thất bại → logout;
     chuẩn hoá lỗi về `ApiError { code, message, details }`
   - `shared/lib/queryClient.ts` — `staleTime`, `retry`, tắt `refetchOnWindowFocus` cho mutation
   - `shared/lib/datetime.ts` — `toUtcIso()`, `formatDate()`, `getDueLabel()` bằng Luxon
   - `shared/constants/error-messages.ts` — map mã lỗi từ API_SPEC sang **tiếng Việt**
   - `shared/types/` — `ApiResponse`, `PaginatedResponse`, `ApiError`
   - `shared/components/feedback/` — `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`
     (UI-SPEC bắt buộc mọi trang xử lý đủ 4 trạng thái)
8. **Setup routing base**:
   - `routes/routes.ts` — hằng số route theo `FE-ARCHITECTURE.md`
   - `routes/index.tsx` — `createBrowserRouter`, 3 nhánh: public / protected / admin
   - `ProtectedRoute.tsx` **và** `AdminRoute.tsx` (dùng `<Outlet />`, không phải `children`)
9. **Setup layouts**: `MainLayout` (Sidebar + Header theo UI-SPEC), `AuthLayout`, `AdminLayout`
10. Keep existing files intact — DO NOT overwrite

**NOT included (do later with `/fe-crud`):**
- Feature components, pages, hooks, services

### Install Missing Dependencies

Check `package.json` and install if not present:

**Core:**
```bash
# Routing (import từ 'react-router', KHÔNG phải 'react-router-dom')
npm install react-router

# Server state
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools

# HTTP
npm install axios

# Forms
npm install react-hook-form zod @hookform/resolvers

# Client state (auth + UI preference only)
npm install zustand

# Ngày giờ — bắt buộc, mọi mốc ngày theo timezone user
npm install luxon
npm install -D @types/luxon

# Biểu đồ trang Thống kê
npm install recharts

# Kéo-thả sắp xếp task
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Toast + icon + tiện ích class
npm install sonner lucide-react clsx tailwind-merge
```

**Styling:**
```bash
# Tailwind v4
npm install -D tailwindcss @tailwindcss/vite
# Tailwind v3 (chỉ khi dự án đang dùng v3)
# npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

**Dev:**
```bash
npm install -D @types/node
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install -D msw                    # test optimistic update + rollback
npm install -D openapi-typescript     # script api:types, sinh type từ Swagger của BE
```

**Before installing:**
- Read `package.json` first
- Only install what's missing
- List what will be installed and ask user to confirm

### Validation

- [ ] Folder structure matches `FE-ARCHITECTURE.md`
- [ ] All required dependencies installed
- [ ] `.env.example` có `VITE_API_BASE_URL`
- [ ] Design token từ `UI-SPEC.md` đã vào Tailwind theme
- [ ] Axios instance có interceptor refresh, không gọi refresh trùng lặp
- [ ] TanStack Query client configured, Devtools chỉ bật ở dev
- [ ] `ProtectedRoute` **và** `AdminRoute` đều tồn tại
- [ ] `error-messages.ts` khớp bảng error code trong `API_SPEC.md`
- [ ] `npm run dev` → app khởi động không lỗi
- [ ] `npm run build` → không lỗi type
- [ ] Project sẵn sàng thêm feature bằng `/fe-crud`

---

## Step 3: Summary & Confirmation (REQUIRED — do NOT skip)

Trước khi cài package hoặc ghi file, trình bày kế hoạch và **chờ người dùng xác nhận**.

```
📋 Plan for /init-base {backend|frontend}

📦 Sẽ CÀI ({N} package):
- joi, argon2, @nestjs/swagger, nestjs-pino, ...
  (đã có sẵn, bỏ qua: @nestjs/config, typeorm, ...)

📁 Thư mục sẽ TẠO:
- src/config/, src/core/, src/shared/, src/database/migrations/
- src/features/{auth,task,task-list,activity,statistic,notification,user-management}/

📄 File sẽ TẠO:
- .env.example
- src/config/typeorm.config.ts
- src/shared/constants/error-codes.constant.ts
- src/shared/exceptions/app.exception.ts
- ... ({N} file)

📝 File sẽ SỬA:
- src/main.ts        → global pipe/filter/interceptor, swagger
- src/app.module.ts  → import core modules
- package.json       → thêm script migration:*, seed

⏭️  BỎ QUA (đã tồn tại):
- ...

⚠️  {N} package, {M} file tạo mới, {K} file sửa.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT install or write anything before the user replies "yes"
- If user says "no" → stop and ask what to change
- If user says "adjust" → update the plan and show it again
- File đã tồn tại thì **hỏi trước khi sửa**, không ghi đè im lặng

---

## Output

```
✅ {Backend|Frontend} architecture setup complete!

📁 Location: ./{backend-nest|frontend-react}/

📦 Dependencies installed:
- [list newly installed packages]

📂 Folder structure created:
- src/features/ (empty, ready for features)
- src/core/ (database, logger, cache, queue, storage)
- src/shared/ (error codes, exceptions, guards, utils)
- src/database/ (migrations, seeds)

⚙️  Configs created:
- .env.example
- src/config/typeorm.config.ts
- src/config/validation.schema.ts

📝 package.json scripts added:
- migration:generate, migration:run, migration:revert, seed

⚠️  Skipped (already exists):
- [list skipped items]

🚀 Next steps:
1. cp .env.example .env
2. docker compose up -d          # backend cần MySQL + Redis chạy trước
3. npm run migration:run && npm run seed
4. npm run {start:dev|dev} to verify
5. Use /be-crud or /fe-crud to create features
```

---

## Important Rules

1. **DO NOT delete or overwrite existing files**
2. **Ask before modifying existing files** (`main.ts`, `app.module.ts`, `package.json`)
3. **Report what was skipped** so user knows what already existed
4. **Keep existing hello world code working**
5. **Argon2, không phải bcrypt** — khớp BE-PROJECT-RULES
6. **`synchronize: false`** kể cả ở local
7. **Không sinh code feature** — entity, controller, service để `/be-crud` làm
8. **Kiểm tra phiên bản Tailwind trước** khi chạy lệnh init
9. **Error code là nguồn duy nhất** — sinh từ API_SPEC.md, cả BE và FE cùng dùng

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing argument | Ask: "Which project? `/init-base backend` or `/init-base frontend`" |
| Doc file not found | List missing docs and ask user to create them first |
| Project not found | Error: "No package.json found. Is this the right directory?" |
| MySQL/Redis chưa chạy (backend) | Nhắc `docker compose up -d` trước bước verify |
| `main.ts` đã có global setup | Hiện diff, hỏi merge hay giữ nguyên |
| Không rõ phiên bản Tailwind | Đọc `package.json`; không đoán, không chạy `tailwindcss init` bừa |
| Package cài lỗi (mạng, peer deps) | Dừng, báo package nào lỗi, không tiếp tục tạo file |
