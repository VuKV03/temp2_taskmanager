# Notification Feature

## Status: complete

## Overview

User notifications for task events and reminders.

## Components

- `NotificationBell` — Header icon, unread badge (9+ caps), embedded in `shared/components/layout/Header.tsx`
- `NotificationDropdown` — Popup list of the 10 most recent notifications + "Đánh dấu đã đọc hết" (only shown when something is unread)
- `NotificationItem` — Single entry, icon/color by `type`; click marks it read and navigates to the task (if `taskId` isn't null)

## Hooks

- `useNotifications(params)` — `GET /notifications`
- `useUnreadCount()` — `GET /notifications/unread-count`, polled every 60s (`refetchInterval`) — non-critical, no websocket
- `useMarkAsRead()`, `useMarkAllAsRead()` — invalidate `['notifications']` (prefix, covers both the list and the unread-count query)

## Dependencies

- auth (user scope)
- task (navigates to `ROUTES.TASK_DETAIL` on click)

## Notes

- No dedicated page/route — this feature is header-only UI, unlike `activity`/`statistic`.
- Server-driven triggers only (task assignment, comments, due-soon/overdue cron) — this feature never creates a notification from the client.
