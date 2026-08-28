# Activity Feature

## Status: complete

## Overview

User activity history and audit trail display.

## Pages

- `HistoryPage` (`/history`) — Timeline of the current user's own actions with filters
- `AdminHistoryPage` (`/admin/history`) — System-wide timeline, filterable by `userId` too, page-based pager (not infinite scroll)

## Components

- `ActivityTimeline` — Vertical timeline grouped by date
- `ActivityItem` — Single activity entry with icon/color by action type, Vietnamese sentence built from `action`/`fieldName`/`oldValue`/`newValue`
- `ActivityFilters` — Filter by action type, date range → URL params (`useSearchParams`)

## Hooks

- `useActivities(params)` — `GET /activities`, `useInfiniteQuery` ("Xem thêm" button, not scroll-triggered)
- `useTaskActivities(taskId, params)` — `GET /tasks/:id/activities`, used by `TaskDetailDrawer`'s history section
- `useAdminActivities(params)` — `GET /admin/activities`, plain `useQuery` (table + pager UX)

## Dependencies

- auth (user info)
- task (task title/link in each item; `TaskDetailDrawer` embeds a compact history section via `useTaskActivities`)

## Notes

- Read-only feature — no mutations, so no cache invalidation to worry about here.
- Nav links added to `TaskListSidebar` ("Lịch sử") and `AdminLayout` ("Lịch sử hệ thống"); `AdminLayout` also grew real nav placeholders for `/fe-crud user-management` and `/fe-crud statistic` to fill in.
