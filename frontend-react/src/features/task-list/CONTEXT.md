# Task List Feature

## Overview

Task list (project/board) management and sidebar navigation. `TaskListSidebar` is mounted inside `MainLayout` (owned by this feature, per FE-ARCHITECTURE.md).

## Components

- `TaskListSidebar` — Quick links (Công việc, Danh sách công việc, Lịch sử, Thống kê, Bốc thăm công việc) + user's lists, drag-to-reorder (dnd-kit)
- `TaskListSidebarItem` — One sortable row: color dot, name (NavLink), edit/delete on hover
- `ListForm` — Modal for create/edit (name, description, color swatch)

## Hooks

- `useLists(includeArchived?)` — Query `/lists`
- `useList(id)` — Query `/lists/:id` (detail + `taskCount`)
- `useCreateList()`, `useUpdateList()`, `useDeleteList()` — Mutations, invalidate `['lists']`, toast on success/error
- `useReorderLists()` — Optimistic update (reorders the cached list immediately, rolls back + toasts on error)

## Business Rules

1. List belongs to one owner — server enforces, FE just reflects `/lists` response
2. Delete = archive (`DELETE /lists/:id`), confirmed via `ConfirmDialog` first — "sẽ được lưu trữ" not "sẽ bị xoá" in the copy, since tasks inside are kept
3. Sidebar list order persists via `sortOrder`; drag reorder is optimistic — UI updates before the request resolves, rolls back on error

## Not implemented in this pass

- No `user-management` quick link here (admin-only pages live under `/admin/*` via `AdminLayout`'s own nav instead)

## Dependencies

- Sidebar mounted in `MainLayout` (`layouts/MainLayout.tsx`)
- Used by `task` feature for the list picker in `TaskFormModal` and for showing list name/color on task cards
