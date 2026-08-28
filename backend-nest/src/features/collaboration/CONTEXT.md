# Collaboration Feature

## Status: complete

Task comments and file attachments for team collaboration.

## Tables Owned

- `task_comments` — Comments on tasks
- `task_attachments` — File uploads

## What exists

- `entities/task-comment.entity.ts`, `entities/task-attachment.entity.ts`
- `repositories/comment.repository.ts`, `repositories/attachment.repository.ts`
- `services/comment.service.ts`, `services/attachment.service.ts`
- `controllers/task-comment.controller.ts` (`/tasks/:id/comments`), `controllers/comment.controller.ts` (`/comments/:id`)
- `controllers/task-attachment.controller.ts` (`/tasks/:id/attachments`), `controllers/attachment.controller.ts` (`/attachments/:id`)
- Migration `1787900886178-create-collaboration-tables.ts`
- `core/storage/storage.service.ts` — new: local-disk (dev default) or S3/MinIO driver, picked by `STORAGE_DRIVER` env var (see `validation.schema.ts`). Local files are served from `<cwd>/uploads` via `app.useStaticAssets` in `main.ts`, prefix `/uploads`.

## Endpoints

### Comments
- `GET /tasks/:id/comments` — List task comments
- `POST /tasks/:id/comments` — Add comment (triggers `task_activities` log, action=`commented`)
- `PATCH /comments/:id` — Edit own comment
- `DELETE /comments/:id` — Delete own comment

### Attachments
- `GET /tasks/:id/attachments` — List files
- `POST /tasks/:id/attachments` — Upload (multipart, field name `files`, single or multiple)
- `DELETE /attachments/:id` — Remove file (best-effort delete from storage, then the DB row)

## Business Rules

1. Comments ordered by `created_at` ASC
2. User can only edit/delete their own comments (`CMT_002`); viewing/commenting requires task creator/assignee/admin (`TASK_002`)
3. Upload limit: 10MB/file (`FILE_002`), 5 files/request (`FILE_002`)
4. Supported types: JPEG, PNG, WebP, PDF, Office docs, plain text (`FILE_003`, see `ALLOWED_ATTACHMENT_MIME_TYPES`)
5. Files stored via `StorageService`, path/URL in `file_url`
6. Comment creation triggers activity log; attachment upload does not (not in spec)
7. Attachment delete allowed by uploader, task owner (creator/assignee), or admin

## Dependencies

- auth (user verification)
- task (`TaskRepository` from `TaskModule`, for existence + ownership checks)
- activity (comment creation logging)
- core/storage (file persistence)
