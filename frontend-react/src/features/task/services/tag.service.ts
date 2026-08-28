import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type { TagSummary, CreateTagPayload, UpdateTagPayload } from '../types/task.types';

export const tagService = {
  getAll: () => api.get<ApiResponse<TagSummary[]>>('/tags'),
  create: (payload: CreateTagPayload) => api.post<ApiResponse<TagSummary>>('/tags', payload),
  update: (id: number, payload: UpdateTagPayload) => api.patch<ApiResponse<TagSummary>>(`/tags/${id}`, payload),
  remove: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/tags/${id}`),
};
