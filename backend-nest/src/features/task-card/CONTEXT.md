# Task Card Feature

## Overview

"Công việc" tab (formerly "Hôm nay"). A task card is a manual, freely-named
grouping of tasks — the name has **no built-in meaning** ("Hôm nay",
"Ngày mai", "Lễ 2/9" are all just labels the user typed; nothing is computed
from them). This is deliberately a second, lighter grouping mechanism
alongside `task-list`'s lists — a task can be in one list *and* one card at
the same time, independently.

## Tables Owned

- `task_cards` — the cards themselves

## Endpoints

- `GET /task-cards` — current user's cards, each with `taskCount`
- `POST /task-cards` — create `{ name }`
- `PATCH /task-cards/:id` — rename
- `DELETE /task-cards/:id` — delete (tasks on it are unlinked via `ON DELETE SET NULL`, never deleted)

Membership itself is **not** a nested endpoint here — a task's card is just
`tasks.card_id`, set through `task`'s own `POST /tasks` / `PATCH /tasks/:id`
(`cardId` field, same shape as `listId`). Reading "what's in this card" is
just `GET /tasks?cardId=X` — no separate read path.

## Business Rules

1. Card belongs to one owner — same as `task-list`, no admin override, `CARD_002` otherwise
2. No uniqueness constraint on `name` (unlike `task-list`) — duplicate card names are fine, this is a much more casual construct
3. `taskCount` in list responses is a raw `COUNT(*) FROM tasks WHERE card_id = ? AND is_archived = 0` query in the repository — **not** a TypeORM relation to `Task`, since `task` depends on `task-card` and importing back would create a circular module dependency (identical reasoning to `task-list`'s `countActiveTasks`)
4. Deleting a card never deletes or archives its tasks — only clears `card_id` (FK `ON DELETE SET NULL`)

## Dependencies

- auth (owner verification)

## Not implemented here

- The old date-computed "Hôm nay"/"Quá hạn"/"Sắp tới" views (`TaskViewController`, `GET /tasks/today|overdue|upcoming`, `useTodayTasks` on the frontend) still exist in `task` but are no longer used by any page — left in place rather than deleted, since removing them wasn't asked for and other code doesn't depend on them.
