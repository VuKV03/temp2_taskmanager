export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_REQUEST = 5;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export interface UserSummary {
  id: number;
  fullName: string;
}

export interface CommentResponse {
  id: number;
  taskId: number;
  content: string;
  user: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentResponse {
  id: number;
  taskId: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: UserSummary;
  createdAt: string;
}

export function toCommentResponse(comment: import('../entities/task-comment.entity.js').TaskComment): CommentResponse {
  return {
    id: comment.id,
    taskId: comment.taskId,
    content: comment.content,
    user: { id: comment.user.id, fullName: comment.user.fullName },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export function toAttachmentResponse(
  attachment: import('../entities/task-attachment.entity.js').TaskAttachment,
): AttachmentResponse {
  return {
    id: attachment.id,
    taskId: attachment.taskId,
    fileUrl: attachment.fileUrl,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    uploadedBy: { id: attachment.uploader.id, fullName: attachment.uploader.fullName },
    createdAt: attachment.createdAt.toISOString(),
  };
}
