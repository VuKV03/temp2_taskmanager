# Random Draw Feature

## Overview

"Bốc thăm công việc" — randomly draws a batch of N items out of a pool
without replacement, round after round, until the pool is exhausted. Pool
source is either a real task list's tasks (snapshotted, read-only — drawing
never touches the underlying `Task` row) or a manually typed list of
arbitrary labels.

## Tables Owned

- `draw_sessions` — one row per pool ("Voc 1..100")
- `draw_items` — one row per pool entry; `is_drawn`/`round_number`/`drawn_at`
  double as the draw history, so there's no separate history table

## Endpoints

- `GET /draw-sessions` — current user's sessions with `totalCount`/`remainingCount`
- `POST /draw-sessions` — create a session (`{ name, sourceType: 'task_list'|'manual', sourceListId?, items?: string[] }`)
- `GET /draw-sessions/:id` — session detail incl. every item (pending + drawn, with `roundNumber` for grouping)
- `PATCH /draw-sessions/:id` — `{ name?, addItems?: string[], removeItemIds?: number[] }`, edit a session (see rule 7)
- `POST /draw-sessions/:id/draw` — `{ count }`, draws up to `count` random pending items
- `DELETE /draw-sessions/:id` — delete a session (cascades to its items)

## Business Rules

1. Session belongs to one owner — same as `task-list`, no admin override, `DRAW_002` otherwise
2. `sourceType: 'task_list'` snapshots `TaskRepository.findLeanByListId` into `draw_items` at creation time — later renaming/archiving/deleting the source task never changes an in-progress session. `taskId` is kept only as a best-effort back-reference (`ON DELETE SET NULL`)
3. `draw()` **clamps** `count` to whatever is left in the pool instead of rejecting an over-large request — this is what actually guarantees "vét cạn" (exhaust the pool): the last round is just however many remain, no error
4. Draw selection is Fisher-Yates (`shared/utils/shuffle.util.ts`) over every still-pending item, backed by `crypto.randomInt` — no replacement, since drawn items flip `is_drawn` and are excluded from every subsequent round's candidate pool
5. When a draw empties the pool, the session flips to `status: 'completed'`; a completed (or already-empty) session's `draw()` call throws `DRAW_003`
6. Drawing an item is display-only — it never assigns/reassigns the underlying `Task`, never changes its status. Purely a randomizer/allocator on top of existing data
7. `update()` only ever touches the *pending* slice of the pool: `addItems` appends freeform labels (always `taskId: null`, even on a `task_list`-sourced session — reuses the same trim/dedupe as `create()`'s manual branch, deduped against every existing label too); `removeItemIds` hard-deletes pending rows (never drawn, so no history to lose) and rejects the whole request (`DRAW_005`) if any id is already drawn/foreign/missing rather than silently dropping part of it. Status is always recomputed from the actual remaining-pending count afterwards — never tracked incrementally — so `addItems` on a `completed` session reopens it (`active`) and `removeItemIds` down to zero completes an `active` one. Drawn items and round history are never touched by `update()`

## Dependencies

- `task-list` (`TaskListRepository`, ownership check when pooling from a real list)
- `task` (`TaskRepository.findLeanByListId`, pool snapshot)
