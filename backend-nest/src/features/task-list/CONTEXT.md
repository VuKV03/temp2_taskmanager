# Task List Feature

## Overview

Task list (aka project/board) management. Users can organize tasks into lists.

## Tables Owned

- `task_lists` — Lists/projects/boards

## Endpoints

- `GET /lists?includeArchived=false` — Get user's lists
- `POST /lists` — Create list
- `GET /lists/:id` — Get list detail + `taskCount`
- `PATCH /lists/:id` — Update list
- `DELETE /lists/:id` — Soft delete (archive)
- `PATCH /lists/reorder` — Bulk update `sortOrder` (`{ items: [{ id, sortOrder }] }`)

## Business Rules

1. List belongs to one owner (creator) — **no admin override**, even admins only see their own lists (Permission Matrix in API_SPEC.md scopes `/lists/*` to "của mình" for both roles)
2. Only owner can view/edit their lists → `LIST_002` otherwise
3. Soft delete via `is_archived = true`
4. Each user's list names must be unique (composite unique key: `owner_id` + `name`) → `LIST_003` on conflict
5. `taskCount` in the detail response is a raw `COUNT(*) FROM tasks WHERE list_id = ? AND is_archived = 0` query in the repository — **not** a TypeORM relation to `Task`, since `task` depends on `task-list` and importing back would create a circular module dependency

## Events

- Listens to `user.registered` (emitted by `auth`) → creates the default "Cá nhân" list for the new user. Failure here is logged, not thrown — must never break registration.

## Dependencies

- auth (owner verification, `user.registered` event)
- (read-only, raw SQL) `tasks` table for task count — see rule #5
