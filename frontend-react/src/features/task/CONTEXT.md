# Task Feature

## Overview

Core task management: today view, filtered/paginated list, detail drawer, subtasks, tags.

## Pages

- `TodayPage` (`/`) — 3 stat cards + "Quá hạn" (red left border, via `TaskTable`'s `isOverdue`) + "Hôm nay" sections, straight from `GET /tasks/today` — no client-side date filtering, no pagination (the endpoint always returns everything for the day; a user explicitly chose not to paginate this view). "Thêm việc" opens `AddTodayTaskDrawer` (a picker over existing tasks), not a blank create form. Row selection is a single `Set` shared across both sections' tables (a task can only be in one, so ids never collide) — one bulk-action bar covers both. **"Xoá" here means "bỏ khỏi Hôm nay", not archive** — see Business Rules #7.
- `TaskListPage` (`/tasks`, `/lists/:id`) — table (`TaskTable`), filters + page/`limit` (10/20/50/100) synced to URL, row checkboxes + bulk delete bar.
- `TaskDetailPage` (`/tasks/:id`) — thin wrapper that opens `TaskDetailDrawer`; `onClose` calls `navigate(-1)`

## Components

- `TaskItem`, `TaskList`, `SortableTaskItem` — the old card/drag-to-reorder rendering. **No page imports these anymore** (both `TodayPage` and `TaskListPage` moved to `TaskTable`) — kept only because `useReorderTasks`/`PATCH /tasks/reorder` still exist backend-side; dead code otherwise, candidate for removal if that endpoint is ever dropped too.
- `TaskTable` — shared by both pages. Columns: checkbox, Tiêu đề, Danh sách, Trạng thái, Ưu tiên, Hạn chót, Hành động (bắt đầu làm → `onStart(task)`, see `useStartTask`, disabled for `done`/`cancelled`; chỉnh sửa → `TaskFormModal` edit mode; xoá → `onDelete(task)`, caller decides what that means). `isOverdue` prop adds the red left border (on the first `<td>`, not the `<tr>` — border on a table row doesn't render under the default `border-collapse: separate`). `deleteLabel`/`deleteIcon`/`deleteIsDangerous` let a caller re-skin the delete action's meaning — `TaskListPage` leaves the defaults (Trash2, "Xoá", red hover = archive); `TodayPage` overrides to `CalendarX`/"Bỏ khỏi hôm nay"/primary hover (clears `dueDate`, non-destructive). Don't add a 4th caller with yet another meaning without adding a 4th set of props to match — the point of these props is that the icon/label always tells the truth about what `onDelete` actually does.
- `AddTodayTaskDrawer` — Today's "Thêm việc" picker: search/status/priority/list filters over `useTasks`, per-row "Hôm nay" button sets `dueDate` (whole-second precision — see Business Rules #6), "Tạo mới" escape hatch into `TaskFormModal`
- `TaskFilters` — search (debounced 400ms) + status/priority toggle chips + tag select, all synced to `useSearchParams`
- `TaskFormModal` — create/edit (title, description, list, priority, due date, estimate, tags); no `parentTaskId`/`recurrenceRule` field here — subtasks are created from `SubtaskList`'s quick-add instead. `defaultDueDate` prop prefills "Hạn chót" (used by `AddTodayTaskDrawer`'s "Tạo mới").
- `TaskDetailDrawer` — inline-editable title/description (click, blur to save), status/priority selects (invalid transitions greyed out via `TASK_STATUS_TRANSITIONS`), due date, list, tags (`TagPicker`), subtasks, delete (archive) with `ConfirmDialog`
- `SubtaskList` — checklist + quick-add input (creates a task with `parentTaskId`)
- `TagPicker` — chips + existing-tag select + inline "new tag" input
- `StatusBadge`, `PriorityBadge` — data-driven colors from `index.css` `@theme` tokens (UI-SPEC.md)
- `TaskTimerClock` — pure countdown-UI (title, minutes, optional `hostWindow`), shared by `TaskTimerFloatingPanel` (in-page, same window) and `TaskTimerPipHost` (Document PiP, a different `hostWindow`) so the two only ever differ in *where* this renders. Takes `hostWindow` because a PiP window is a second, separate `Window`/`document` — `setInterval`/`document.title`/`AudioContext` must all target *that* window, not the opener's, or the countdown/title/beep silently happen in the wrong place.
- `TaskTimerPipHost` — mounted once at the app root, renders only when the active session has a `pipWindow` (see Business Rules #8). Portals `TaskTimerClock` into it via `createPortal`, copies the opener's stylesheets + `<html>` class (dark mode) in — a PiP window starts as a bare `about:blank` document with none of that.
- `TaskTimerFloatingPanel` — mounted once at the app root too, renders only when the active session has **no** `pipWindow` (the fallback path). A plain `position: fixed` card, dragged via pointer events clamped to the viewport. Both host components read the same `useTaskTimerStore` session; exactly one of them ever renders anything for a given session.

## Hooks

- `useTasks(params)`, `useTask(id)`, `useTodayTasks()` — queries
- `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()`, `useBulkDeleteTasks()` — mutations, invalidate `['tasks']` + `['stats']`. Bulk hits `DELETE /tasks/bulk` (body `{ ids }`), one transaction backend-side. **Only `TaskListPage` calls these two delete hooks** — they archive (`is_archived = true`).
- `useBulkRemoveFromToday()` — `TodayPage`'s bulk action; **not** a delete hook despite living next to them. No bulk endpoint exists for "clear dueDate", so it fans out `Promise.all` over plain `useUpdateTask`-style `PATCH .../tasks/:id` calls (`{ dueDate: null }`) and invalidates once at the end. The single-row case on `TodayPage` skips this hook entirely and just calls `useUpdateTask()` directly with the same payload.
- `useUpdateTaskStatus()` — **optimistic**: patches the task in every cached shape under the `['tasks', ...]` prefix (detail object, paginated list, today view) before the request resolves; rolls back all of them on error
- `useStartTask()` — "Bắt đầu làm": requires `task.estimateMinutes` set (toasts and bails otherwise — no default duration); prefers Document Picture-in-Picture (`window.documentPictureInPicture.requestWindow()`, Chrome/Edge 116+ — see Business Rules #8), falls back to the in-page session on other browsers. Either way, for a `todo` task it also fires `useUpdateTaskStatus` to `in_progress` (skipped if already `in_progress`, so re-opening the timer doesn't re-fire it). **`requestWindow()` runs before the status mutation, not after** — it's only granted synchronously off a user gesture; awaiting the (async) status mutation first breaks that and the request gets silently refused.
- `useTaskTimerStore()` (Zustand, `stores/taskTimer.store.ts`) — holds the single active timer `session` (`{ taskId, title, minutes, pipWindow? }` or `null`). `pipWindow` present ⇒ `TaskTimerPipHost` renders it; absent ⇒ `TaskTimerFloatingPanel` does. Opening a new session while one is active replaces it (closing any existing `pipWindow` first) — one timer at a time.
- `useReorderTasks()` — optimistic reorder of the currently-open list query
- `useReplaceTags()`, `useTags()`, `useCreateTag()` — tag management

## Business Rules

1. Today view: trust the server's `overdue`/`today` split and `date`/`timezone` fields completely — never re-filter by date on the client (FE-PROJECT-RULES.md anti-pattern)
2. Status dropdown disables options that aren't a valid transition from the current status (mirrors backend `TASK_STATUS_TRANSITIONS`) — but the server is still the source of truth; a stale client can still get `TASK_003` back, shown via `getErrorMessage`
3. Toggling the checkbox on a task with unfinished subtasks can fail with `TASK_005` — optimistic update rolls back and shows the mapped Vietnamese message
4. Invalidate `['tasks']` (prefix) + `['stats']` + `['activities']` after any status change — `['stats']`/`['activities']` are inert right now since those features aren't built yet, kept for when they are
5. Drag-to-reorder is no longer exposed in the UI on either page (both are `TaskTable` now) — `useReorderTasks`/`PATCH /tasks/reorder` are unused but left in place
6. Never build a `dueDate` from Luxon's `.endOf('day')` (23:59:59.999) — `due_date` is a `DATETIME` with no fractional-second precision, so MySQL rounds `.999` up to `00:00:00` the *next* day. Use whole-second precision instead (`.set({ hour: 23, minute: 59, second: 59, millisecond: 0 })`, as `AddTodayTaskDrawer` does).
7. **"Xoá" on `TodayPage` never archives.** A task showing up in Today/Overdue got there because its `dueDate` falls in that window (`findTodayTasks`/`findOverdueTasks`, both date-range queries) — removing it from *this page* only requires making that no longer true, i.e. `PATCH { dueDate: null }`. It must stay fully intact (still `todo`, still visible, still editable) in `TaskListPage`. `UpdateTaskPayload.dueDate` is typed `string | null` specifically to make `null` (clear) distinguishable from omitted (leave untouched) — the backend already treats them differently (`dto.dueDate !== undefined ? (dto.dueDate ? new Date(...) : null) : /* untouched */`), so no backend change was needed for this rule, only a frontend one.
8. **The "Bắt đầu làm" timer prefers Document Picture-in-Picture over an in-page panel, on purpose, despite its ugly origin bar.** History: first built as `window.open` (full address bar). A user wanted that gone → tried Document PiP (smaller, but still a mandatory "localhost:5173" bar — no window feature/API suppresses it on *any* real separate window, by design, for anti-phishing; see [WICG's Document PiP spec](https://wicg.github.io/document-picture-in-picture/)) → switched to a pure in-page floating panel instead, which has zero browser chrome since it isn't a real window at all → then the user pointed out the actual requirement: the timer must stay visible even after switching browser tabs, which **only** a real always-on-top window (PiP) can do — an in-page panel is part of one tab's DOM and simply isn't rendered while another tab is focused. Net result: PiP is preferred (ugly bar, but persists across tabs); the in-page panel is only the fallback for browsers without the API. Don't "clean up" this back to panel-only without re-confirming the cross-tab requirement no longer matters.

## Not implemented in this pass

- Comments, attachments, activity/history tab in the detail drawer — depend on `collaboration`/`activity` features, not built on either side yet
- Reassigning a task to another user from the drawer — needs a user picker, which needs `user-management`; the `PATCH /tasks/:id/assignee` service call isn't wired to any UI yet
- `recurrenceRule` — no form field; the backend accepts and validates it, but nothing in the FE sets it
- Statistics/History quick links in the sidebar (see `task-list/CONTEXT.md`)

## Dependencies

- auth (current user's timezone shown implicitly via server responses; permission-driven UI is minimal since the server enforces ownership)
- task-list (list picker in `TaskFormModal`/`TaskDetailDrawer`, list name shown on `TaskItem`)
