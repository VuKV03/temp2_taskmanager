import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  DrawSession,
  DrawSessionDetail,
  DrawResult,
  CreateDrawSessionPayload,
  UpdateDrawSessionPayload,
} from '../types/random-draw.types';

export const randomDrawService = {
  getAll: () => api.get<ApiResponse<DrawSession[]>>('/draw-sessions'),

  getById: (id: number) => api.get<ApiResponse<DrawSessionDetail>>(`/draw-sessions/${id}`),

  create: (payload: CreateDrawSessionPayload) =>
    api.post<ApiResponse<DrawSessionDetail>>('/draw-sessions', payload),

  update: (id: number, payload: UpdateDrawSessionPayload) =>
    api.patch<ApiResponse<DrawSessionDetail>>(`/draw-sessions/${id}`, payload),

  draw: (id: number, count: number) => api.post<ApiResponse<DrawResult>>(`/draw-sessions/${id}/draw`, { count }),

  remove: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/draw-sessions/${id}`),
};
