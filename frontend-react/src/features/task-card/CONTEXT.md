# Task Card Feature

## Overview

Manual, freely-named task groupings ("Hôm nay", "Ngày mai", "Lễ 2/9" — labels
only, no computed meaning). Backs `task`'s `TaskCardPage` (`/`). See
`backend-nest/src/features/task-card/CONTEXT.md` for the full design
rationale (why this exists as a *second*, separate grouping alongside
`task-list`'s lists).

## Components

- `TaskCardGrid` — the grid `TaskCardPage` renders when no card is selected. Each tile shows name + `taskCount`, with hover-reveal rename/delete icons (sibling `<button>`s next to the tile's own select `<button>`, not nested inside it — nested `<button>`s are invalid HTML and behave unpredictably). Owns its own `TaskCardFormModal` (create + edit) and delete `ConfirmDialog`; `formOpen`/`onCloseForm` props let the parent page's own "Thẻ mới" header button drive the create modal from outside.
- `TaskCardFormModal` — single-field (name) create/edit modal, same `isEdit = !!card` shape as `task-list/ListForm`.

## Hooks

- `useTaskCards()` — list query, key `['task-cards']`
- `useCreateTaskCard()`, `useUpdateTaskCard()` — invalidate `['task-cards']`
- `useDeleteTaskCard()` — invalidates `['task-cards']` **and** `['tasks']` — deleting a card unlinks every task on it (`card_id` → `NULL` server-side), so any open task view filtered by that card needs to refetch too

## Business Rules

1. `['task-cards']` must also be invalidated by `task`'s own `useCreateTask`/`useUpdateTask`/`useDeleteTask`/`useBulkDeleteTasks` — a task's `cardId` moving is what actually changes a card's `taskCount`, and this feature's own mutations never touch `tasks`. Missing this cross-invalidation was a real bug caught by Playwright, not `tsc`: the grid kept showing a stale `taskCount` after adding a task to a card until something unrelated happened to refetch it.
2. Card selection lives in `TaskCardPage`'s local `selectedCardId` state, not a route — this feature has no page/route of its own.

## Dependencies

- None on other features. `task` depends on this one (not the reverse) for the card picker in its forms and the grid on `TaskCardPage`.
