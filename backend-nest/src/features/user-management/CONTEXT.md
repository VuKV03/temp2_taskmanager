# User Management Feature (Admin only)

## Status: complete

Admin endpoints for user management, role assignment, and account status control.

## Tables Owned

None — operates on `users` (and `roles`, `refresh_tokens`) through entities registered directly here, not via `AuthModule` (same reasoning as `activity`/`statistic` reusing `Task`: only the raw repositories are needed).

## Endpoints

- `GET /admin/users` — List all users, filters: `role`, `isActive`, `q` (email/fullName LIKE)
- `GET /admin/users/:id` — Detail + `taskStats: {total, completed}` (assignee-scoped, all-time — a quick snapshot, not a range-bound analytic; for real analytics see `statistic`'s `/admin/stats/by-user`)
- `POST /admin/users` — Create user manually (`AUTH_005` if email taken)
- `PATCH /admin/users/:id` — Update `fullName`/`avatarUrl`/`timezone`
- `PATCH /admin/users/:id/role` — Change role (no-op if unchanged, skips the transaction/token-revoke)
- `PATCH /admin/users/:id/status` — Activate/deactivate
- `PATCH /admin/users/:id/reset-password` — Admin sets a new password directly (`ResetPasswordDto.newPassword`) — **no email infra** in this project to send a reset link/temp password
- `DELETE /admin/users/:id` — Soft delete (`is_active = false`)

## Business Rules

1. Admin cannot change their own role (`USER_002`) or deactivate their own account (`USER_003`) — prevents self-lockout
2. Cannot demote (`role`) or delete the last admin (`USER_005`) — `AdminUserRepository.countAdmins()` counts by role regardless of `is_active`, the stricter reading
3. Changing role or status (deactivating only — activating doesn't need to force a re-login) revokes all `refresh_tokens` for that user; so does reset-password
4. Soft delete sets `is_active = false` (reuses `updateStatus`'s revoke path, doesn't hard-delete)
5. Every mutating action logs to `task_activities` with `task_id = NULL`, `action: 'updated'` (or `'archived'` for delete), `metadata: { targetUserId }` — per API_SPEC.md's `PATCH /admin/users/:id/role` worked example, generalized to every admin action here, not just role changes

## Dependencies

- auth (`User`/`Role`/`RefreshToken` entities registered directly; `RefreshTokenRepository` re-provided here since `AuthModule` doesn't export the class)
- task (`Task` entity, for the detail page's `taskStats` only)
- activity (logs admin actions)
