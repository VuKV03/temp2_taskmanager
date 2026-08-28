# User Management Feature

## Status: complete

Admin-only user management (list, edit roles, lock/unlock accounts).

## Pages

- `AdminUserListPage` (`/admin/users`) — table with filters (`role`, `isActive`, `q` search) synced to URL + pager + "Thêm người dùng"
- `AdminUserDetailPage` (`/admin/users/:id`) — profile + task stats + action buttons (hidden when viewing your own profile)

## Components

- `UserTable` — rows with role/status badges, `UserActionMenu` per row
- `UserActionMenu` — dropdown: View detail, Change role, Lock/unlock, Reset password (last 3 hidden when the row is the current user — server enforces too, this is just UX)
- `RoleChangeDialog` — toggles to the *other* role (binary), warns about forced logout
- `LockAccountDialog` — confirm dialog, label/danger-styling flips based on current `isActive`
- `ResetPasswordDialog` — modal with a new-password input (admin sets it directly — no email infra to send a reset link)
- `CreateUserModal` — not in the original spec list but wired up since the backend has `POST /admin/users`; simple form (email/password/fullName/role)

## Hooks

- `useUsers(params)`, `useUserDetail(id)`
- `useCreateUser()`, `useUpdateUserRole()`, `useUpdateUserStatus()`, `useResetUserPassword()`, `useDeleteUser()` — all but `useResetUserPassword` invalidate `['admin-users']`

## Business Rules

1. Current user cannot change their own role or lock their own account — `UserActionMenu`/detail page hide those actions for `isSelf`; server still enforces (`USER_002`/`USER_003`) as the real guard
2. Changing role or status (locking) logs the user out of all devices — every dialog says so
3. Page/nav hidden from non-admin — `AdminRoute` + `AdminLayout` (not this feature)

## Dependencies

- auth (current user, for the `isSelf` check; `AdminLayout`'s "Người dùng" nav link was added when `activity` built out that layout)
