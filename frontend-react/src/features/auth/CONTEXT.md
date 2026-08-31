# Auth Feature

## Overview

Authentication and authorization for the task manager application.

## Pages

- `LoginPage` — Login form with email/password
- `RegisterPage` — Register form with name, email, password, timezone selection
- `ProfilePage` (`/profile`, linked from `Header`'s "Hồ sơ") — Telegram chat-id linking only (save + "Gửi thử" test-send); name/avatar/timezone editing still not wired to a page (see "Not implemented" below)

## Components

- `LoginForm` — Email/password + link to register
- `RegisterForm` — Name, email, password, confirm password, timezone select

## Hooks

- `useLogin()` — Mutation for login; sets the store + `shared/lib/axios` token on success
- `useRegister()` — Mutation for register (no auto-login, per API_SPEC.md)
- `useCurrentUser()` — Query for `/auth/me`, enabled only while authenticated
- `useLogout()` — Mutation; clears store + query cache regardless of server result, navigates to `/login`
- `useChangePassword()` — Mutation for password change
- `useUpdateProfile()` — Mutation for `PATCH /auth/me`; updates the Zustand store's `user` and the `['auth','me']` query cache directly on success (no refetch needed)
- `useSendTelegramTest()` — Mutation for `POST /auth/me/telegram/test`; `USER_006` if not linked yet, `USER_007` if the send itself fails
- `useAuthBootstrap()` — Called once from `App.tsx`. On mount, silently calls `POST /auth/refresh` (httpOnly cookie) to get a new access token, since the token itself is memory-only and lost on reload. `ProtectedRoute` shows a full-page spinner while this is in flight (`isInitializing`) instead of bouncing to `/login`.

## Store (Zustand) — `stores/auth.store.ts`

```ts
{ user, accessToken, isAuthenticated, isInitializing, login(), setUser(), setAccessToken(), logout(), finishInitializing() }
```

The store never talks to axios directly for the token — it calls `setAccessToken()` exported from `shared/lib/axios.ts`, which holds the token in a module-level variable used by the request interceptor. This keeps `shared/` free of any import from `features/auth` (dependency direction: features → shared only).

## Axios wiring (`shared/lib/axios.ts`)

- Request interceptor attaches `Authorization: Bearer <token>` from the module-level token holder
- Response interceptor: on `401` (not already retried, not the refresh call itself) — de-duplicates concurrent refreshes into one in-flight promise, retries the original request once
- If refresh itself fails, calls the `onUnauthorized` handler registered by `useAuthBootstrap` (logs the store out)
- `api.*` is a thinly-typed wrapper (`get/post/patch/put/delete`) so service files get `Promise<T>` instead of fighting Axios's `AxiosResponse<T>` typing — the interceptor already unwraps to the response body (`{ success, data, meta? }`)

## Business Rules

1. New users get `member` role by default (cannot be changed during registration)
2. Login provides access token (memory) + refresh token (httpOnly cookie, set by the server)
3. Refresh token auto-refresh on 401 (one-time, queues other requests via the shared `refreshPromise`)
4. Logout clears client state even if the server call fails (network blip, already-expired token)
5. Timezone stored in user profile; task feature trusts server-computed date ranges instead of recomputing client-side

## Not implemented in this pass

- `/auth/sessions` UI (list/revoke active sessions) — service methods exist (`authService.sessions`, `.revokeSession`) but no page wires them yet
- Full profile edit (name/avatar/timezone) — `useUpdateProfile`/`UpdateProfilePayload` support all three, `ProfilePage` just doesn't render inputs for them yet (only `telegramChatId`)
