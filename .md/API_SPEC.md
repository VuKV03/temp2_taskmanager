# API Specification

## Overview

| Setting | Value |
|---------|-------|
| Base URL | `/api/v1` |
| Versioning | URL path (`/api/v1/`, `/api/v2/`) |
| Content-Type | `application/json` |
| Encoding | UTF-8 |
| Datetime format | ISO 8601 UTC (`2026-08-28T10:30:00Z`) |
| Naming (JSON) | `camelCase` (DB dùng `snake_case`, map ở tầng DTO) |
| ID format | `number` (BIGINT) — FE **không** tự parse thành int, giữ nguyên kiểu server trả |

---

## Authentication

### Token Flow

```
┌─────────┐     POST /auth/login      ┌─────────┐
│ Client  │ ──────────────────────────▶│ Server  │
│         │◀────────────────────────── │         │
└─────────┘  access_token (body)       └─────────┘
             refresh_token (httpOnly cookie)
```

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access Token | 15 minutes | Client memory |
| Refresh Token | 7 days | httpOnly cookie |

### Header Format

```
Authorization: Bearer <access_token>
X-Timezone: Asia/Ho_Chi_Minh    (optional, override users.timezone)
```

### Protected Routes

- **Public**: Register, Login, Refresh
- **Protected**: Toàn bộ endpoint còn lại yêu cầu JWT hợp lệ
- **Admin**: Endpoint dưới `/admin/*` yêu cầu role `admin`
- **Ownership**: Với route không phải `/admin/*`, server **luôn** lọc theo `user_id` từ token — không bao giờ tin `userId` gửi từ body/query

### Auth Errors

| Code | Status | Description |
|------|--------|-------------|
| AUTH_001 | 401 | Invalid credentials |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 401 | Token invalid |
| AUTH_004 | 403 | Insufficient permissions |
| AUTH_005 | 409 | Email already exists |
| AUTH_006 | 403 | Account is locked (`is_active = false`) |
| AUTH_007 | 401 | Refresh token revoked |

---

## Request Conventions

### Pagination

```
GET /tasks?page=2&limit=20
```

| Param | Type | Default | Max |
|-------|------|---------|-----|
| page | number | 1 | - |
| limit | number | 20 | 100 |

### Sorting

```
GET /tasks?sort=due_date&order=asc
```

| Resource | Allowed sort fields |
|----------|---------------------|
| tasks | `due_date`, `priority`, `created_at`, `updated_at`, `sort_order` |
| activities | `created_at` |
| users (admin) | `created_at`, `last_login_at`, `email` |

*Field không nằm trong whitelist → `SYS_002`. Không bao giờ nối thẳng chuỗi sort vào SQL.*

### Filtering

```
GET /tasks?status=todo,in_progress        # OR trong cùng field
GET /tasks?priority=high,urgent
GET /tasks?listId=5&assigneeId=12
GET /tasks?tagIds=1,3
GET /tasks?dueFrom=2026-08-01&dueTo=2026-08-31
GET /tasks?q=báo cáo                       # search title + description
GET /tasks?includeArchived=false           # default false
```

**Quy ước**: nhiều field khác nhau = AND; nhiều giá trị trong 1 field = OR.

### Date Params

| Param | Format | Ghi chú |
|-------|--------|---------|
| `dueFrom`, `dueTo` | `YYYY-MM-DD` | Server quy đổi sang UTC theo timezone của user |
| `from`, `to` (stats) | `YYYY-MM-DD` | Inclusive cả 2 đầu |

### File Upload

```
Content-Type: multipart/form-data
Field: file (single) | files (multiple)
Max size: 10MB/file, 5 files/request
Types: image/jpeg, image/png, image/webp, application/pdf,
       application/vnd.openxmlformats-officedocument.*, text/plain
```

### Rate Limiting

| Nhóm endpoint | Giới hạn |
|---------------|----------|
| `/auth/login`, `/auth/register` | 5 req / 60s / IP |
| Upload | 20 req / 60s / user |
| Còn lại | 100 req / 60s / user |

*Vượt ngưỡng → `429` + `SYS_003`, kèm header `Retry-After`.*

---

## Response Format

### Success (Single)

```json
{
  "success": true,
  "data": { "id": 1, "title": "Viết báo cáo tuần" },
  "message": "Created successfully"
}
```

### Success (List + Pagination)

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "TASK_001",
    "message": "Task not found",
    "details": {}
  }
}
```

### Validation Error (`SYS_002`)

```json
{
  "success": false,
  "error": {
    "code": "SYS_002",
    "message": "Validation error",
    "details": {
      "title": ["title should not be empty"],
      "dueDate": ["dueDate must be a valid ISO 8601 date"]
    }
  }
}
```

*`details` luôn là object `{ field: string[] }` để FE map thẳng vào form.*

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| **Auth** |||
| AUTH_001 | 401 | Invalid credentials |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 401 | Token invalid |
| AUTH_004 | 403 | Insufficient permissions |
| AUTH_005 | 409 | Email already exists |
| AUTH_006 | 403 | Account is locked |
| AUTH_007 | 401 | Refresh token revoked |
| **User** |||
| USER_001 | 404 | User not found |
| USER_002 | 400 | Cannot modify your own role |
| USER_003 | 400 | Cannot deactivate your own account |
| USER_004 | 400 | Old password incorrect |
| USER_005 | 400 | Cannot delete the last admin |
| **List** |||
| LIST_001 | 404 | List not found |
| LIST_002 | 403 | Not the list owner |
| LIST_003 | 409 | List name already exists |
| **Task** |||
| TASK_001 | 404 | Task not found |
| TASK_002 | 403 | No access to this task |
| TASK_003 | 400 | Invalid status transition |
| TASK_004 | 400 | Subtask cannot have subtask (max depth 1) |
| TASK_005 | 400 | Cannot complete: subtasks unfinished |
| TASK_006 | 400 | Assignee is inactive or not found |
| TASK_007 | 400 | Circular parent reference |
| **Tag** |||
| TAG_001 | 404 | Tag not found |
| TAG_002 | 409 | Tag name already exists |
| **Comment** |||
| CMT_001 | 404 | Comment not found |
| CMT_002 | 403 | Not the comment author |
| **File** |||
| FILE_001 | 404 | Attachment not found |
| FILE_002 | 400 | File too large |
| FILE_003 | 400 | Unsupported file type |
| **System** |||
| SYS_001 | 500 | Internal server error |
| SYS_002 | 400 | Validation error |
| SYS_003 | 429 | Too many requests |

---

## Endpoints by Feature

### Auth Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new user (role `member`) | No |
| POST | `/auth/login` | Login, get tokens | No |
| POST | `/auth/refresh` | Refresh access token | No* |
| POST | `/auth/logout` | Logout, revoke current token | Yes |
| POST | `/auth/logout-all` | Revoke all tokens | Yes |
| GET | `/auth/me` | Get current user + role | Yes |
| PATCH | `/auth/me` | Update profile (name, avatar, timezone) | Yes |
| PATCH | `/auth/change-password` | Change password | Yes |
| GET | `/auth/sessions` | List active sessions | Yes |
| DELETE | `/auth/sessions/:id` | Revoke a session | Yes |

*Uses refresh token from httpOnly cookie

### Task List Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/lists` | List danh sách của user | Yes |
| POST | `/lists` | Create list | Yes |
| GET | `/lists/:id` | List detail + task count | Yes |
| PATCH | `/lists/:id` | Update list | Yes |
| DELETE | `/lists/:id` | Archive list (soft) | Yes |
| PATCH | `/lists/reorder` | Bulk update `sort_order` | Yes |

### Task Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tasks` | List + filter + paginate | Yes |
| POST | `/tasks` | Create task | Yes |
| GET | `/tasks/:id` | Detail (+ subtasks, tags, counts) | Yes |
| PATCH | `/tasks/:id` | Update task | Yes |
| DELETE | `/tasks/:id` | Archive task (soft) | Yes |
| PATCH | `/tasks/:id/status` | Change status | Yes |
| PATCH | `/tasks/:id/assignee` | Assign to user | Admin |
| PATCH | `/tasks/reorder` | Bulk update `sort_order` | Yes |
| PUT | `/tasks/:id/tags` | Replace toàn bộ tag của task | Yes |
| GET | `/tasks/today` | **Công việc hôm nay** | Yes |
| GET | `/tasks/overdue` | Quá hạn | Yes |
| GET | `/tasks/upcoming` | 7 ngày tới | Yes |

**Admin Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/admin/tasks` | List task toàn hệ thống | Admin |
| DELETE | `/admin/tasks/:id` | Hard delete | Admin |

### Tag Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tags` | Tag của user + tag hệ thống | Yes |
| POST | `/tags` | Create tag | Yes |
| PATCH | `/tags/:id` | Update tag | Yes |
| DELETE | `/tags/:id` | Delete tag (gỡ khỏi mọi task) | Yes |

### Comment & Attachment Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tasks/:id/comments` | List comments | Yes |
| POST | `/tasks/:id/comments` | Create comment | Yes |
| PATCH | `/comments/:id` | Update own comment | Yes |
| DELETE | `/comments/:id` | Delete own comment | Yes |
| GET | `/tasks/:id/attachments` | List attachments | Yes |
| POST | `/tasks/:id/attachments` | Upload files | Yes |
| DELETE | `/attachments/:id` | Delete attachment | Yes |

### History Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/activities` | **Lịch sử** của chính user | Yes |
| GET | `/tasks/:id/activities` | Lịch sử 1 task | Yes |
| GET | `/admin/activities` | Lịch sử toàn hệ thống (filter `userId`) | Admin |

### Statistics Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/stats/summary` | **Thống kê** tổng quan cá nhân | Yes |
| GET | `/stats/completion` | Chuỗi hoàn thành theo ngày/tuần/tháng | Yes |
| GET | `/stats/by-status` | Phân bố theo status | Yes |
| GET | `/stats/by-priority` | Phân bố theo priority | Yes |
| GET | `/admin/stats/overview` | Tổng quan toàn hệ thống | Admin |
| GET | `/admin/stats/by-user` | Hiệu suất theo từng user | Admin |

### Notification Feature

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/notifications` | List (filter `isRead`) | Yes |
| GET | `/notifications/unread-count` | Badge count | Yes |
| PATCH | `/notifications/:id/read` | Mark as read | Yes |
| PATCH | `/notifications/read-all` | Mark all as read | Yes |

### User Management Feature (Admin only)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/admin/users` | **Trang người dùng** — list + filter | Admin |
| GET | `/admin/users/:id` | Detail + thống kê task của user | Admin |
| POST | `/admin/users` | Tạo user thủ công | Admin |
| PATCH | `/admin/users/:id` | Update thông tin | Admin |
| PATCH | `/admin/users/:id/role` | Đổi role | Admin |
| PATCH | `/admin/users/:id/status` | Khoá / mở khoá | Admin |
| PATCH | `/admin/users/:id/reset-password` | Reset mật khẩu | Admin |
| DELETE | `/admin/users/:id` | Soft delete (`is_active = false`) | Admin |

---

## Endpoint Details

### POST /auth/register

```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Nguyen Van A",
  "timezone": "Asia/Ho_Chi_Minh"
}

// Response 201
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "member",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "message": "Registration successful"
}
```

**Business Logic:**
1. Password ≥ 8 ký tự, có chữ và số
2. Role luôn gán cứng `member` — **không** nhận `role` từ client
3. Tạo sẵn 1 list mặc định "Cá nhân" cho user mới
4. Không auto-login; FE gọi tiếp `/auth/login`

| Error | Status | Condition |
|-------|--------|-----------|
| AUTH_005 | 409 | Email exists |
| SYS_002 | 400 | Invalid email / weak password |

---

### POST /auth/login

```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "avatarUrl": null,
      "role": "member",
      "timezone": "Asia/Ho_Chi_Minh"
    }
  }
}
// + Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth
```

**Business Logic:**
1. Sai email và sai password đều trả `AUTH_001` với cùng message (tránh dò email)
2. `is_active = false` → `AUTH_006`
3. Insert `refresh_tokens` kèm `device_name`, `ip_address`, `user_agent`
4. Cập nhật `users.last_login_at`

---

### GET /tasks/today

```
GET /api/v1/tasks/today?includeOverdue=true
```

```json
// Response 200
{
  "success": true,
  "data": {
    "date": "2026-08-28",
    "timezone": "Asia/Ho_Chi_Minh",
    "overdue": [
      {
        "id": 41,
        "title": "Gửi báo cáo tháng 7",
        "status": "todo",
        "priority": "high",
        "dueDate": "2026-08-25T10:00:00Z",
        "list": { "id": 2, "name": "Công việc", "color": "#4F46E5" },
        "tags": [{ "id": 1, "name": "Gấp", "color": "#EF4444" }]
      }
    ],
    "today": [
      {
        "id": 57,
        "title": "Họp team 2h chiều",
        "status": "in_progress",
        "priority": "medium",
        "dueDate": "2026-08-28T07:00:00Z",
        "subtaskCount": 3,
        "completedSubtaskCount": 1
      }
    ],
    "counters": { "overdue": 1, "today": 5, "completedToday": 2 }
  }
}
```

**Business Logic:**
1. Mốc ngày tính theo `users.timezone` (hoặc header `X-Timezone`), **không** dùng `CURDATE()` của MySQL
2. Điều kiện: `assignee_id = me AND due_date IN [startOfDay, endOfDay) AND status NOT IN ('done','cancelled')`
3. `overdue`: `due_date < startOfDay` và chưa done — luôn tách riêng khỏi `today`
4. Task không có `due_date` **không** xuất hiện ở trang này
5. `completedToday` đếm theo `completed_at`, không theo `updated_at`
6. Endpoint này không phân trang (giới hạn hợp lý 200 bản ghi)

---

### PATCH /tasks/:id/status

```json
// Request
{ "status": "done" }

// Response 200
{
  "success": true,
  "data": {
    "id": 57,
    "status": "done",
    "completedAt": "2026-08-28T09:12:00Z",
    "updatedAt": "2026-08-28T09:12:00Z"
  },
  "message": "Status updated"
}
```

**Business Logic:**
1. Kiểm tra quyền: là `assignee` / `creator`, hoặc `admin`
2. Transition hợp lệ (xem bảng *Task Status Flow* bên dưới), sai → `TASK_003`
3. → `done`: set `completed_at = NOW()`; rời khỏi `done`: set `completed_at = NULL`
4. Task cha chỉ `done` được khi mọi subtask đã `done`/`cancelled` → nếu không, `TASK_005`
5. Insert `task_activities` với `action = status_changed`, `old_value`, `new_value`
6. Gói bước 3–5 trong **một transaction**

| Error | Status | Condition |
|-------|--------|-----------|
| TASK_001 | 404 | Task not found |
| TASK_002 | 403 | Không phải task của mình |
| TASK_003 | 400 | Transition không hợp lệ |
| TASK_005 | 400 | Còn subtask chưa xong |

---

### POST /tasks

```json
// Request
{
  "title": "Viết tài liệu API",
  "description": "Bản v1 cho FE",
  "listId": 2,
  "parentTaskId": null,
  "assigneeId": null,
  "priority": "high",
  "dueDate": "2026-08-30T10:00:00Z",
  "estimateMinutes": 120,
  "recurrenceRule": null,
  "tagIds": [1, 3]
}

// Response 201
{
  "success": true,
  "data": {
    "id": 58,
    "title": "Viết tài liệu API",
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-08-30T10:00:00Z",
    "list": { "id": 2, "name": "Công việc" },
    "creator": { "id": 1, "fullName": "Nguyen Van A" },
    "assignee": { "id": 1, "fullName": "Nguyen Van A" },
    "tags": [{ "id": 1, "name": "Gấp" }],
    "createdAt": "2026-08-28T08:00:00Z"
  }
}
```

**Business Logic:**
1. `creator_id` lấy từ token, bỏ qua nếu client gửi lên
2. `assigneeId` bỏ trống → mặc định chính người tạo; gán cho **người khác** chỉ admin làm được (`AUTH_004`)
3. `listId` phải thuộc sở hữu của user → nếu không, `LIST_002`
4. `parentTaskId` chỉ nhận task cấp 1 (max depth 1) → vi phạm trả `TASK_004`
5. Subtask kế thừa `list_id` của task cha
6. `recurrenceRule` nhận chuỗi RRULE rút gọn (`FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,WE`); sai cú pháp → `SYS_002`
7. Task lặp lại **bắt buộc** có `dueDate` — đó là mốc để sinh lần kế tiếp
8. Log `task_activities` với `action = created`

---

### GET /stats/summary

```
GET /api/v1/stats/summary?from=2026-08-01&to=2026-08-28
```

```json
// Response 200
{
  "success": true,
  "data": {
    "range": { "from": "2026-08-01", "to": "2026-08-28" },
    "totals": {
      "created": 64,
      "completed": 48,
      "overdue": 5,
      "inProgress": 7,
      "completionRate": 0.75
    },
    "byStatus": [
      { "status": "todo", "count": 9 },
      { "status": "in_progress", "count": 7 },
      { "status": "done", "count": 48 },
      { "status": "cancelled", "count": 0 }
    ],
    "byPriority": [
      { "priority": "urgent", "count": 4 },
      { "priority": "high", "count": 18 },
      { "priority": "medium", "count": 30 },
      { "priority": "low", "count": 12 }
    ],
    "byList": [
      { "listId": 2, "name": "Công việc", "total": 40, "completed": 31 }
    ],
    "streakDays": 6,
    "avgCompletionHours": 18.4
  }
}
```

**Business Logic:**
1. Mặc định `from` = đầu tháng hiện tại, `to` = hôm nay (theo timezone user)
2. `completionRate = completed / (created - cancelled)`, làm tròn 2 chữ số; mẫu = 0 → trả `0`
3. `cancelled` **không** tính là hoàn thành và bị loại khỏi mẫu số
4. Khoảng thời gian > 90 ngày → đọc từ `user_daily_stats`; ngắn hơn thì `GROUP BY` trực tiếp trên `tasks`
5. Response cache 60s theo `user_id + range`

---

### PATCH /admin/users/:id/role

```json
// Request
{ "role": "admin" }

// Response 200
{
  "success": true,
  "data": { "id": 12, "email": "b@example.com", "role": "admin" },
  "message": "Role updated"
}
```

**Business Logic:**
1. Admin **không** được đổi role của chính mình → `USER_002` (tránh tự khoá hệ thống)
2. Hạ role admin cuối cùng xuống `member` → `USER_005`
3. Đổi role → revoke toàn bộ `refresh_tokens` của user đó, buộc đăng nhập lại
4. Log vào `task_activities` với `task_id = NULL`, `metadata` chứa `{ targetUserId }`

| Error | Status | Condition |
|-------|--------|-----------|
| USER_001 | 404 | User not found |
| USER_002 | 400 | Tự đổi role mình |
| USER_005 | 400 | Admin cuối cùng |

---

### GET /activities

```
GET /api/v1/activities?page=1&limit=20&action=status_changed&from=2026-08-01
```

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 902,
      "action": "status_changed",
      "taskId": 57,
      "taskTitle": "Họp team 2h chiều",
      "taskDeleted": false,
      "fieldName": "status",
      "oldValue": "in_progress",
      "newValue": "done",
      "user": { "id": 1, "fullName": "Nguyen Van A" },
      "createdAt": "2026-08-28T09:12:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 240, "totalPages": 12 }
}
```

**Business Logic:**
1. `taskTitle` lấy từ snapshot trong `task_activities`, không JOIN sang `tasks` → task bị xoá vẫn đọc được lịch sử
2. `taskDeleted = (task_id IS NULL)`; FE dùng cờ này để tắt link điều hướng
3. Bảng append-only: **không có** endpoint PATCH/DELETE cho activity
4. Member chỉ thấy activity của chính mình; admin dùng `/admin/activities` để xem tất cả

---

## Business Rules

*Các quyết định dễ quên hoặc dễ làm sai — FE và BE thống nhất theo bảng này.*

| # | Quy tắc | Lý do |
|---|---------|-------|
| 1 | Mốc "hôm nay" tính theo `users.timezone`, không theo giờ server | Task nhảy sai ngày với user khác múi giờ |
| 2 | `completed_at` là nguồn duy nhất cho thống kê hoàn thành, không dùng `updated_at` | Sửa title cũng làm đổi `updated_at` |
| 3 | `cancelled` không tính là hoàn thành, và bị loại khỏi mẫu số của tỉ lệ | Tránh thổi phồng completion rate |
| 4 | Xoá task = `is_archived = true` (soft) | Giữ toàn vẹn lịch sử và thống kê |
| 5 | `task_activities` giữ snapshot `task_title` | Lịch sử vẫn đọc được sau khi task biến mất |
| 6 | Subtask tối đa 1 cấp | Tránh đệ quy vô hạn ở UI và query |
| 7 | Task cha chỉ done khi mọi subtask đã done/cancelled | Tránh trạng thái mâu thuẫn |
| 8 | Chỉ admin được gán task cho người khác | Member chỉ quản lý việc của mình |
| 9 | Server luôn lấy `userId` từ token, không từ payload | Chống IDOR |
| 10 | Đổi role hoặc khoá tài khoản → revoke toàn bộ refresh token | Quyền cũ còn sống tối đa 7 ngày nếu không revoke |
| 11 | Mọi thay đổi trên `tasks` phải sinh 1 bản ghi `task_activities` trong cùng transaction | Lịch sử không được lệch với dữ liệu |
| 12 | `PUT /tasks/:id/tags` thay thế toàn bộ tag, không cộng dồn | Tránh phải gọi nhiều lần khi bỏ tag |
| 13 | Task không có `due_date` không xuất hiện ở "Hôm nay"/"Quá hạn" | Ngày là điều kiện bắt buộc của 2 trang này |
| 14 | Enum trả về nguyên dạng `snake_case` (`in_progress`), FE tự map sang label hiển thị | Tránh vỡ khi đổi ngôn ngữ giao diện |
| 15 | Tiền tệ/số phút luôn là số nguyên, không dùng float | Tránh sai số |
| 16 | Task lặp lại: job sinh **bản ghi mới**, không dời `due_date` của bản cũ | Giữ được lịch sử hoàn thành từng lần |
| 17 | Task lặp lại phải có `due_date` | Không có mốc thì không sinh được lần kế tiếp |

---

## Task Status Flow

| Từ → Đến | Cho phép | Side effect |
|----------|----------|-------------|
| `todo` → `in_progress` | ✅ | Log `status_changed` |
| `todo` → `done` | ✅ | Set `completed_at`, log |
| `in_progress` → `done` | ✅ | Set `completed_at`, log |
| `in_progress` → `todo` | ✅ | Log |
| `done` → `todo` / `in_progress` | ✅ | Set `completed_at = NULL`, log |
| any → `cancelled` | ✅ | Giữ `completed_at = NULL` |
| `cancelled` → any | ❌ | Trả `TASK_003` — tạo task mới thay vì mở lại |

---

## Permission Matrix

| Endpoint group | member | admin |
|----------------|--------|-------|
| `/auth/*` | ✅ | ✅ |
| `/lists/*`, `/tasks/*` (của mình) | ✅ | ✅ |
| `/tasks/:id/assignee` | ❌ | ✅ |
| `/stats/*` (cá nhân) | ✅ | ✅ |
| `/activities` (của mình) | ✅ | ✅ |
| `/admin/tasks`, `/admin/activities`, `/admin/stats/*` | ❌ | ✅ |
| `/admin/users/*` | ❌ | ✅ |

*Kiểm tra ở guard tầng server. Ẩn menu ở FE chỉ là UX, không phải bảo mật.*

---

## NestJS Implementation Notes

```typescript
// Swagger decorators
@ApiTags('tasks')
@ApiOperation({ summary: "Get today's tasks for current user" })
@ApiResponse({ status: 200, type: TodayTasksResponseDto })

// Controller
@Get('today')
@UseGuards(JwtAuthGuard)
async getToday(
  @CurrentUser() user: User,
  @Query() query: TodayQueryDto,
): Promise<TodayTasksResponseDto> {
  return this.taskService.getToday(user, query);
}

// Admin guard
@Patch(':id/role')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async updateRole(@Param('id') id: number, @Body() dto: UpdateRoleDto) {}

// Rate limiting (auth endpoints)
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
async login(@Body() dto: LoginDto) {}

// Validation toàn cục — chặn field lạ như "role" gửi kèm lúc register
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
);
```

**Best Practices**:
- DTO riêng cho request và response; không trả thẳng entity (lộ `password_hash`)
- `ClassSerializerInterceptor` + `@Exclude()` cho field nhạy cảm
- Interceptor chung bọc mọi response về format `{ success, data, meta }`
- `ExceptionFilter` chung map exception → bảng error code ở trên
- Ghi `task_activities` bằng transaction cùng thao tác chính, không dùng event bất đồng bộ ở v1
- Swagger tại `/api/docs`, export OpenAPI JSON để FE sinh type bằng `openapi-typescript`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-08-28 | Bản đầu: Auth, Lists, Tasks, Tags, Comments, History, Stats, Admin Users |
