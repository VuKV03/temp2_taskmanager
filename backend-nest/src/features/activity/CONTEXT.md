# Activity Feature

## Status: complete

Both the append-only write path and the read side are implemented.

## Tables Owned

- `task_activities` — Append-only. No UPDATE/DELETE, ever.

## What exists

- `entities/task-activity.entity.ts`
- `services/activity-logger.service.ts` — `log(manager, payload)`, must be called inside the caller's transaction (see `task/services/task-status.service.ts` for the pattern)
- `repositories/activity.repository.ts` — paginated queries: by user, by task, admin (optional `userId` filter)
- `services/activity.service.ts` — ownership check for `findForTask` (creator/assignee/admin only)
- `controllers/activity.controller.ts` — `GET /activities`, `GET /tasks/:id/activities`
- `controllers/admin-activity.controller.ts` — `GET /admin/activities`
- Exported via `ActivityModule` for any feature that needs to log (`ActivityLoggerService` only)

## Endpoints

- `GET /activities` — Lịch sử của chính user (filter `action`, `from`, `to`)
- `GET /tasks/:id/activities` — Lịch sử 1 task (403 `TASK_002` nếu không phải creator/assignee/admin)
- `GET /admin/activities` — Lịch sử toàn hệ thống (filter `userId`), Admin only

## Business Rules

1. `taskTitle` is a snapshot taken at write time — never JOIN to `tasks` to render history, a deleted task must still show its old activity
2. `taskDeleted` in the response = `(task_id IS NULL)`
3. Member sees only their own activity; admin uses `/admin/activities`
4. No PATCH/DELETE — bảng append-only

## Dependencies

- auth (`user_id` relation)
- task (`Task` entity registered directly here, not via `TaskModule`, to avoid a module cycle — see `activity.module.ts` comment)
