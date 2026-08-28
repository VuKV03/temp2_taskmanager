# Auth Feature

## Overview

Authentication and user management feature for the task manager application.
Base module — every other feature depends on it for `User`, `JwtAuthGuard`,
`RolesGuard`, `@CurrentUser()`.

## Tables Owned

- `roles` — User roles (admin, member)
- `users` — User accounts
- `refresh_tokens` — Refresh token tracking

## Endpoints

### Public (`@Public()`)
- `POST /auth/register` — Register new user (throttled 5/60s/IP)
- `POST /auth/login` — Login, get access token + `refreshToken` httpOnly cookie (throttled 5/60s/IP)
- `POST /auth/refresh` — Refresh access token using httpOnly cookie

### Protected
- `GET /auth/me` — Get current user info
- `PATCH /auth/me` — Update profile (name, avatar, timezone)
- `PATCH /auth/change-password` — Change password (revokes all sessions)
- `POST /auth/logout` — Logout, revoke current refresh token
- `POST /auth/logout-all` — Revoke all refresh tokens
- `GET /auth/sessions` — List active sessions (marks current one)
- `DELETE /auth/sessions/:id` — Revoke a specific session

## Business Rules

1. Password ≥ 8 characters, must include letters and numbers (`@Matches` in DTOs)
2. New users always get `member` role — role is never read from the request body
3. Email must be unique across system (`AUTH_005`)
4. Argon2id hashing (`shared/utils/hash.util.ts`) for passwords — **not** bcrypt
5. Refresh tokens are opaque random strings; only their SHA-256 hash is stored (`shared/utils/token.util.ts`) — deterministic hash so it can be looked up, unlike Argon2
6. JWT access token: 15 minutes (stateless — no DB check per request); refresh token: 7 days
7. Refresh token stored in httpOnly, `SameSite=Strict` cookie scoped to `/api/v1/auth`, never accessible to JS
8. Explicit revoke (logout / logout-all / change-password / admin lock) invalidates all future refresh uses; an already-issued 15-minute access token is not individually revocable (accepted tradeoff of short-lived stateless JWTs)
9. `JwtAuthGuard` + `RolesGuard` are registered as **global guards** in `app.module.ts` — every endpoint in the app is protected by default; use `@Public()` to opt out and `@Roles('admin')` for admin-only routes
10. Login failure (wrong email or wrong password) always returns the same `AUTH_001`, with a dummy-hash verify when the email doesn't exist, to avoid leaking which emails are registered via response timing

## Events

- Emits `user.registered` (`{ userId }`) after a successful register — `task-list` listens to this to create the default "Cá nhân" list. Kept decoupled via `EventEmitter2` instead of a direct import (see BE-ARCHITECTURE.md Cross-Feature Communication) since losing the default list on an emitter hiccup is not critical.

## Dependencies

- None (base module). Exports `AuthService`, `UserRepository`, and `TypeOrmModule` (for the `User`/`Role` entities) so other features read user data without reaching into `auth`'s internals.

## Not implemented here

- `/activities`, `/notifications` — separate features, out of scope for this pass
- Refresh token rotation — v1 keeps a single long-lived refresh token per login instead of rotating on every `/auth/refresh`
