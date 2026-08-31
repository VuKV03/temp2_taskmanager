# Random Draw Feature

## Overview

"Bốc thăm công việc" — a master-detail page (`/random-draw`, own sidebar
tab) for `random-draw`'s draw sessions. See
`backend-nest/src/features/random-draw/CONTEXT.md` for the exhaustive-draw
design (clamping, Fisher-Yates, status recomputation).

## Pages

- `RandomDrawPage` — left panel (`DrawSessionListPanel`) lists sessions with a name/status/remaining summary; right panel shows `DrawSessionDetail` for whichever `selectedId` is clicked, or a placeholder prompt if none is (local `useState`, no per-session route — same convention `task-card`'s `TaskCardPage` later reused).

## Components

- `DrawSessionListPanel` — session picker, highlights `selectedId`, empty state prompts creating the first session
- `CreateDrawSessionModal` — radio toggle between "Từ danh sách có sẵn" (`sourceListId` select, populated via `task-list`'s `useLists()`) and "Nhập tay" (`Textarea` parsed by `parseManualItems`); on success, selects the new session
- `EditDrawSessionModal` — rename + an "add more items" textarea (also parsed by `parseManualItems`); intentionally does **not** handle removal — that's inline on the pool badges instead (see below)
- `DrawSessionDetail` — the bulk of the feature: progress bar, count input + "Bốc ngay" button (client-side clamps `count` to `remainingCount` before calling `useDraw`, mirroring the backend's own clamp so the input's `max` isn't just decorative), a highlighted "Kết quả vừa bốc" block for the latest round, a collapsed-by-round history list for earlier rounds, and a "Ngân hàng còn lại" pool of badges — each pending badge has its own inline `×` (`useUpdateDrawSession({removeItemIds:[id]})`) so removing one item never needs opening a modal. Status badge color reads from `--color-status-done`/`--color-status-in-progress` **via inline `style`**, not a `bg-status-*` className — `Badge`'s own doc comment says data-driven colors go through `style`, not classNames (className-based overrides also technically work through `tailwind-merge`, but this isn't the component's documented API).
- `utils/parse-items.ts` — `parseManualItems`: splits on newlines *and* commas, dedupes, trims, drops blanks — shared by both modals so "Voc 1, Voc 2, ..." pastes and one-per-line textareas both work identically to the backend's own manual-source parsing.

## Hooks

- `useDrawSessions()` — list query, key `['draw-sessions']`
- `useDrawSession(id)` — detail query, key `['draw-sessions', id]`
- `useCreateDrawSession()`, `useDraw(sessionId)` — invalidate both the list and the specific detail key (drawing/creating never invalidates a *different* session's detail, only its own)
- `useUpdateDrawSession(sessionId)` — same dual invalidation; safe to do (unlike delete below) since the session still exists afterward
- `useDeleteDrawSession()` — **must** `removeQueries({queryKey:['draw-sessions', id], exact:true})` instead of a bare `invalidateQueries(['draw-sessions'])` — see Business Rules #1

## Business Rules

1. **Never invalidate `['draw-sessions']` as a bare prefix from the delete hook.** It prefix-matches the just-deleted session's still-open `['draw-sessions', id]` detail query (mounted for another instant before the caller's `onDeleted()` unmounts `DrawSessionDetail`), triggering a refetch that's guaranteed to 404. Real bug, caught only by watching Playwright's console output — see [[taskmanager-gotchas]]. Fixed with `removeQueries({..., exact:true})` for the specific id + `invalidateQueries({..., exact:true})` for the list only.
2. `DrawSessionDetail`'s round grouping (`groupByRound`) is purely a client-side `Map` built from the detail response's flat `items` array (`isDrawn`+`roundNumber`) — there's no separate "rounds" endpoint.
3. Deleting the currently-open session (`onDeleted` prop) must clear `selectedId` in the parent page — otherwise the detail panel would keep trying to render a session that's already gone.

## Dependencies

- task-list (`useLists()` for the "Từ danh sách có sẵn" source picker)
- shared UI (`Badge`, `Modal`, `ConfirmDialog`, feedback components) — no dependency on `task` or `task-card`; drawing is deliberately a read-only overlay on top of whichever list a session was created from, never a live join
