# Statistic Feature

## Status: complete

## Overview

Dashboard analytics with charts, metrics, and trends. Read-only.

## Pages

- `StatisticPage` (`/statistic`) — summary cards + streak/avg-completion banner + completion line chart + status pie + priority bar
- `AdminStatisticPage` (`/admin/statistic`) — same charts system-wide (no `assigneeId` scope) + user performance table

## Components

- `SummaryCards` — 4 tiles: created, completed, overdue, tỉ lệ hoàn thành (%)
- `CompletionChart` — Recharts `LineChart`, day/week/month bucketing done server-side (`groupBy` param)
- `StatusPieChart`, `PriorityBarChart` — Recharts, colored from the same CSS custom properties as `StatusBadge`/`PriorityBadge` (`var(--color-status-*)`/`var(--color-priority-*)`) — never hardcoded hex, stays in sync with `index.css` if the palette changes
- `DateRangePicker` — `from`/`to` → URL params (`useSearchParams`), shareable/F5-safe like `TaskFilters`
- `UserPerformanceTable` — admin only

## Hooks

- `useStatsSummary(params)`, `useCompletionTrend(params)`, `useAdminStatsOverview(params)`, `useAdminStatsByUser(params)`

## Notes

- No mutations here — nothing to invalidate. Server caches responses 60s (see backend `StatsService`), so a manual refresh right after an edit may show slightly stale numbers for up to a minute; not worth working around client-side.
- `byStatus`/`byPriority` always include all 4 enum values (`count: 0` when absent) — components don't need empty-bucket handling beyond the "everything is zero" empty state.
- `avgCompletionHours`/`streakDays` are backend-computed and NOT range-bound (see backend CONTEXT.md) — displayed as a standalone banner, not tied to the `DateRangePicker`.

## Dependencies

- auth (current user scope for the personal page; admin check for the admin page, enforced server-side too)
- task (`TaskStatus`/`TaskPriority` labels reused from `task/types/task.types`)
