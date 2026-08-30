# Task Feature

## Overview

Core task management: CRUD, status state machine, today/overdue/upcoming
views, subtasks (depth 1), tags. Central feature — most other features
depend on it.

## Tables Owned

- `tasks` — Tasks with status, priority, due date, assignments
- `tags` — Labels for categorization
- `task_tags` — N:N relationship

## Endpoints

### Task CRUD (`controllers/task.controller.ts`)
- `GET /tasks` — List with filters and pagination (own tasks: creator or assignee)
- `POST /tasks` — Create task
- `GET /tasks/:id` — Detail view (+ subtasks count, tags)
- `PATCH /tasks/:id` — Update
- `DELETE /tasks/:id` — Soft delete (`is_archived = true`)
- `DELETE /tasks/bulk` — Soft delete multiple (body `{ ids: number[] }`, registered before `:id` to avoid route collision); same per-task ownership check as single delete, one transaction, `TASK_001` if any id isn't found/accessible
- `PATCH /tasks/:id/status` — Change status (state machine, own transaction)
- `PATCH /tasks/:id/assignee` — Assign (`@Roles('admin')`)
- `PATCH /tasks/reorder` — Bulk reorder (registered before `:id` to avoid route collision)
- `PUT /tasks/:id/tags` — Replace all tags (not append)

### Task Views (`controllers/task-view.controller.ts`)
- `GET /tasks/today` — Today's tasks by timezone (`X-Timezone` header overrides `users.timezone`)
- `GET /tasks/overdue` — Overdue tasks
- `GET /tasks/upcoming` — Next 7 days

### Tags (`controllers/tag.controller.ts`)
- `GET /tags`, `POST /tags`, `PATCH /tags/:id`, `DELETE /tags/:id`

### Admin (`controllers/admin-task.controller.ts`, `@Roles('admin')`)
- `GET /admin/tasks` — List all tasks in system
- `DELETE /admin/tasks/:id` — Hard delete

## Business Rules

1. Task status flow: `todo ↔ in_progress ↔ done`, any → `cancelled` (dead end) — `services/task-status.service.ts`, table `TASK_STATUS_TRANSITIONS` in `types/task.types.ts`
2. Only `done` status sets `completed_at`; leaving `done` clears it; `cancelled` always clears it
3. Subtask max depth = 1 — creating a task under a task that already has a parent → `TASK_004`
4. Parent can only go `done` when every subtask is `done`/`cancelled` → `TASK_005`
5. Subtask inherits `list_id` from its parent (client-sent `listId` is ignored for subtasks)
6. Admin can assign to others (`PATCH /tasks/:id/assignee`); on create, a member can only self-assign (`AUTH_004` otherwise)
7. "Hôm nay" is computed from `users.timezone` (or `X-Timezone` header), never `CURDATE()` — see `shared/utils/date-range.util.ts`
8. `completed_at` is the sole source of truth for completion stats, not `updated_at`
9. Ownership: a task is accessible to its `creator`, its `assignee`, or an admin — `TASK_002` otherwise
10. Every write on `tasks` logs one `task_activities` row in the same transaction (`ActivityLoggerService`, from the minimal `activity` module)
11. Recurring tasks (rule #16): `recurrence_rule` acts as a "torch" held by exactly one row in a series. `RecurringTaskProcessor` (BullMQ, `recurring-tasks` queue, daily at 00:05 — `services/task-recurrence.service.ts`) finds every row still holding the torch whose `due_date` has passed, clones it into a **new** row (next occurrence's due date, same `recurrence_rule`), and clears `recurrence_rule` on the old row — the old row's `due_date` is never moved, matching the rule's wording exactly. A missed cron window (server down) catches up one occurrence per run on subsequent runs rather than ever double-booking a date. Next-occurrence math (`shared/utils/recurrence.util.ts`) supports the same subset `CreateTaskDto`'s `RRULE_PATTERN` validates: `FREQ=DAILY`, `FREQ=WEEKLY(;BYDAY=...)`, `FREQ=MONTHLY`.

## Dependencies

- auth (`UserRepository` for assignee validation, `JwtAuthGuard`/`RolesGuard` globally)
- task-list (`TaskListRepository` for `listId` ownership check)
- activity (`ActivityLoggerService`, write-only)
- core/queue (`BullModule`, for the recurring-task processor)
