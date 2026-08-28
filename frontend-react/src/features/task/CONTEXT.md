# Task Feature

## Overview

Core task management: today view, filtered/paginated list, detail drawer, subtasks, tags.

## Pages

- `TodayPage` (`/`) — 3 stat cards + "Quá hạn" (red left border) + "Hôm nay" sections, straight from `GET /tasks/today` — no client-side date filtering
- `TaskListPage` (`/tasks`, `/lists/:id`) — filters + pagination synced to URL, drag-to-reorder when no filter is active
- `TaskDetailPage` (`/tasks/:id`) — thin wrapper that opens `TaskDetailDrawer`; `onClose` calls `navigate(-1)`

## Components

- `TaskItem` — checkbox (optimistic toggle), title, list/due/subtask-count meta, tags, `PriorityBadge`
- `TaskList` — plain list, or dnd-kit sortable list when `draggable`
- `SortableTaskItem` — drag handle wrapper around `TaskItem`, shown only on hover (UI-SPEC.md)
- `TaskFilters` — search (debounced 400ms) + status/priority toggle chips + tag select, all synced to `useSearchParams`
- `TaskFormModal` — create/edit (title, description, list, priority, due date, estimate, tags); no `parentTaskId`/`recurrenceRule` field here — subtasks are created from `SubtaskList`'s quick-add instead
- `TaskDetailDrawer` — inline-editable title/description (click, blur to save), status/priority selects (invalid transitions greyed out via `TASK_STATUS_TRANSITIONS`), due date, list, tags (`TagPicker`), subtasks, delete (archive) with `ConfirmDialog`
- `SubtaskList` — checklist + quick-add input (creates a task with `parentTaskId`)
- `TagPicker` — chips + existing-tag select + inline "new tag" input
- `StatusBadge`, `PriorityBadge` — data-driven colors from `index.css` `@theme` tokens (UI-SPEC.md)

## Hooks

- `useTasks(params)`, `useTask(id)`, `useTodayTasks()` — queries
- `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()` — mutations, invalidate `['tasks']` + `['stats']`
- `useUpdateTaskStatus()` — **optimistic**: patches the task in every cached shape under the `['tasks', ...]` prefix (detail object, paginated list, today view) before the request resolves; rolls back all of them on error
- `useReorderTasks()` — optimistic reorder of the currently-open list query
- `useReplaceTags()`, `useTags()`, `useCreateTag()` — tag management

## Business Rules

1. Today view: trust the server's `overdue`/`today` split and `date`/`timezone` fields completely — never re-filter by date on the client (FE-PROJECT-RULES.md anti-pattern)
2. Status dropdown disables options that aren't a valid transition from the current status (mirrors backend `TASK_STATUS_TRANSITIONS`) — but the server is still the source of truth; a stale client can still get `TASK_003` back, shown via `getErrorMessage`
3. Toggling the checkbox on a task with unfinished subtasks can fail with `TASK_005` — optimistic update rolls back and shows the mapped Vietnamese message
4. Invalidate `['tasks']` (prefix) + `['stats']` + `['activities']` after any status change — `['stats']`/`['activities']` are inert right now since those features aren't built yet, kept for when they are
5. Drag-to-reorder in `TaskListPage` is disabled while any filter/search is active (reordering a filtered subset would corrupt `sortOrder` for the rest of the list)

## Not implemented in this pass

- Comments, attachments, activity/history tab in the detail drawer — depend on `collaboration`/`activity` features, not built on either side yet
- Reassigning a task to another user from the drawer — needs a user picker, which needs `user-management`; the `PATCH /tasks/:id/assignee` service call isn't wired to any UI yet
- `recurrenceRule` — no form field; the backend accepts and validates it, but nothing in the FE sets it
- Statistics/History quick links in the sidebar (see `task-list/CONTEXT.md`)

## Dependencies

- auth (current user's timezone shown implicitly via server responses; permission-driven UI is minimal since the server enforces ownership)
- task-list (list picker in `TaskFormModal`/`TaskDetailDrawer`, list name shown on `TaskItem`)
