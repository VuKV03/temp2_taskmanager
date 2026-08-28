# Collaboration Feature

## Status: complete

## Overview

Task comments and file attachments, embedded directly in `TaskDetailDrawer` (per UI-SPEC.md's drawer mockup — stacked sections, not tabs): Việc con → Đính kèm → Bình luận → Lịch sử.

## Components

- `CommentList` — list + inline edit/delete (own comments only) + `CommentForm`
- `CommentItem` — click-to-edit like the task title, `ConfirmDialog` for delete
- `CommentForm` — textarea + gửi button, Ctrl/Cmd+Enter submits
- `AttachmentList` — upload button (hidden `<input type=file multiple>`), list with size, opens in new tab via `resolveAttachmentUrl`, delete with `ConfirmDialog`

## Hooks

- `useComments(taskId)`, `useCreateComment(taskId)`, `useUpdateComment(taskId)`, `useDeleteComment(taskId)`
- `useAttachments(taskId)`, `useUploadAttachments(taskId)`, `useDeleteAttachment(taskId)`
- All mutations invalidate `['comments', taskId]` / `['attachments', taskId]`; comment creation also invalidates `['activities']` (triggers a `commented` activity server-side)

## Notes

- `resolveAttachmentUrl` (in `services/collaboration.service.ts`) turns the backend's `fileUrl` into something openable from the browser: absolute already when `STORAGE_DRIVER=s3`, needs the backend origin prefixed when it's a relative `/uploads/...` path (`STORAGE_DRIVER=local`, the dev default — see backend `core/storage/storage.service.ts`).
- No dedicated page/route — this feature is UI only, embedded via `TaskDetailDrawer` in the `task` feature.
- Errors (`FILE_002` too-large, `FILE_003` unsupported-type, `CMT_002` not-author) surfaced via `getErrorMessage`, never raw `error.message`.

## Dependencies

- auth (current user, for the own-comment edit/delete check)
- task (`TaskDetailDrawer` embeds `CommentList`/`AttachmentList`)
