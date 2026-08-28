import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type { Comment, Attachment } from '../types/collaboration.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
/** Backend origin without the `/api/v1` suffix — local-driver `fileUrl`s are relative (`/uploads/...`). */
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, '');

/** `fileUrl` is absolute already when `STORAGE_DRIVER=s3`, relative (`/uploads/...`) when `local`. */
export function resolveAttachmentUrl(fileUrl: string): string {
  return /^https?:\/\//.test(fileUrl) ? fileUrl : `${API_ORIGIN}${fileUrl}`;
}

export const collaborationService = {
  getComments: (taskId: number) => api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`),
  createComment: (taskId: number, content: string) =>
    api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { content }),
  updateComment: (id: number, content: string) => api.patch<ApiResponse<Comment>>(`/comments/${id}`, { content }),
  deleteComment: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/comments/${id}`),

  getAttachments: (taskId: number) => api.get<ApiResponse<Attachment[]>>(`/tasks/${taskId}/attachments`),
  uploadAttachments: (taskId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post<ApiResponse<Attachment[]>>(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/attachments/${id}`),
};
