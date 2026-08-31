# Notification Feature

## Status: complete

User notifications for task events: due soon, overdue, assignment, comments.

## Tables Owned

- `notifications` — User notification records

## What exists

- `entities/notification.entity.ts`
- `repositories/notification.repository.ts` — list/count/mark-read + `existsForTask` (dedup for the cron job)
- `services/notification.service.ts` — read side (list, unread-count, mark-read, mark-all-read)
- `services/notification-events.listener.ts` — `@OnEvent('task.assigned')` / `@OnEvent('task.commented')`, the **only** way this feature is triggered by `task`/`collaboration` — see `types/notification-events.types.ts`. Neither of those modules imports `notification`; they `EventEmitter2.emit(...)` (already globally registered via `EventEmitterModule.forRoot()` in `app.module.ts`), fully decoupled.
- `services/notification-cron.service.ts` — `@Cron(EVERY_15_MINUTES)`, generates `due_soon`/`overdue` notifications
- `controllers/notification.controller.ts`
- Migration `1787900887178-create-notifications-table.ts`
- `task/repositories/task.repository.ts` grew `findNotificationCandidates()` for the cron job

## Endpoints

- `GET /notifications` — List notifications (filter `isRead`)
- `GET /notifications/unread-count` — Badge count
- `PATCH /notifications/:id/read` — Mark one as read (`NOTIF_001` if not found/not yours)
- `PATCH /notifications/read-all` — Mark all as read

## Business Rules

1. Notification types: `due_soon`, `overdue`, `assigned`, `commented`
2. Soft read flag via `is_read` (never delete)
3. `unread-count` returns `{ count: number }` for the badge
4. Deduplication: `existsForTask(userId, taskId, type)` — never a second `due_soon`/`overdue` for the same task
5. Non-critical: every write path (event listener, cron) catches and logs its own errors rather than throwing — a lost notification must never fail the task/comment action that triggered it, or crash the cron batch over one bad row
6. **Outbound Telegram** (realtime push, alongside the always-created DB row): if a user has linked `users.telegram_chat_id` (`auth`'s `PATCH /auth/me`) and `TELEGRAM_BOT_TOKEN` is configured, every trigger below also fires `TelegramService.sendMessage`. Same best-effort tolerance as rule 5 — swallowed/logged, never thrown. The DB `message` text is never changed for this; Telegram gets its own emoji-prefixed copy built at the call site

## Triggers

- **Task assigned**: `TaskService.assign` emits `task.assigned` after the transaction commits
- **Comment added**: `CommentService.create` emits `task.commented` to creator+assignee, excluding the commenter
- **Due soon**: cron every 15 min — due by end of tomorrow *in the assignee's timezone*, not done/cancelled/archived
- **Overdue**: same cron — due before start of today *in the assignee's timezone*
- Cron uses a single generous UTC prefetch (`findNotificationCandidates`, 48h lookahead) then re-checks each row against its own assignee's timezone in application code — a single SQL predicate can't express "per-row timezone"

## Dependencies

- auth (user scope; also `UserRepository` to resolve a `telegramChatId` off an event payload's bare `userId`)
- task (`TaskRepository` from `TaskModule`, cron only — no reverse dependency)
- core/telegram (`TelegramService`, outbound push — see rule 6)
- (event contract with) collaboration — via `EventEmitter2`, not a module import
