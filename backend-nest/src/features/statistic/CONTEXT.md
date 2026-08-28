# Statistic Feature

## Status: complete (simplified — no aggregation table)

Dashboard analytics and performance metrics. Read-only views of task data.

## Tables Owned

- None. `user_daily_stats` from DATABASE.md is **not implemented** — it's explicitly optional ("for performance"); this feature always computes live via `GROUP BY` on `tasks`, so API_SPEC.md rule #4 (">90 days → `user_daily_stats`") is intentionally skipped. Fine at dev/demo scale; would need that aggregate + a populating cron before a real >90-day range is heavily used.

## Endpoints

### Personal
- `GET /stats/summary` — `{ range, totals, byStatus, byPriority, byList, streakDays, avgCompletionHours }`, cached 60s per `user_id + range`
- `GET /stats/completion` — completion trend, `?groupBy=day|week|month` (default `day`)
- `GET /stats/by-status`, `GET /stats/by-priority` — standalone versions of the summary's breakdowns

### Admin
- `GET /admin/stats/overview` — same shape as personal `totals`/`byStatus`/`byPriority` plus `totalUsers`, system-wide (no `assigneeId` filter)
- `GET /admin/stats/by-user` — `{ userId, fullName, created, completed, completionRate }[]`, sorted by `completionRate` desc

## Business Rules (and how they were interpreted where the spec was ambiguous)

1. **Read-only** — no insert/update
2. `completed_at` is the sole source of truth for completion (never `updated_at`)
3. `cancelled` excluded from `completionRate`'s denominator: `completed / (created - cancelled)`, 2 decimals, `0` if denominator ≤ 0
4. **`byStatus`/`byPriority`/`byList`/`created`/`completed`/`cancelled` counts do NOT filter `is_archived`** — DATABASE.md rule #4 says soft-delete ("archive") must preserve statistics integrity. Only `totals.overdue` and `totals.inProgress` exclude archived tasks, because those two are *live snapshots* (today's overdue/in-progress count), not range-bound historical aggregates — same filtering as `task`'s today/overdue views.
5. `byStatus`/`byPriority`/`byList` are grouped over tasks **created** in `[from, to]`; `totals.completed`/`avgCompletionHours` are computed over tasks **completed** in `[from, to]` — these are two different populations that can overlap. `totals.overdue`/`totals.inProgress` are current-state snapshots, not range-bound at all.
6. `streakDays` = consecutive days ending today (assignee's timezone) with ≥1 completion — **not range-bound**, always "current streak" regardless of the requested `from`/`to`.
7. `avgCompletionHours` = avg hours from `created_at` to `completed_at`, rounded to 1 decimal, `0` if no completions in range.
8. Default range when `from`/`to` omitted: start of current month → today, in the requesting user's timezone (admin endpoints default in UTC — no single timezone applies system-wide).
9. Response cached 60s (`CACHE_MANAGER`, Redis-backed — same `CacheModule` as the rest of the app) keyed by `user_id + range` (personal) or just `range` (admin).
10. `byPriority`/`byStatus` always return all enum values, `count: 0` when absent — display order is `urgent→low` for priority (not enum declaration order) and `todo→in_progress→done→cancelled` for status, matching the API_SPEC.md worked example.

## Dependencies

- auth (user scope, timezone; `User` entity for `countUsers`/`by-user` join — via `EntityManager.getRepository`, not a module import)
- task (`Task` entity registered directly here, not via `TaskModule` — same reasoning as `activity`)
- core/cache (`CACHE_MANAGER`, already globally registered)
