import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type { TaskCard, CreateTaskCardPayload, UpdateTaskCardPayload } from '../types/task-card.types';

export const taskCardService = {
  getAll: () => api.get<ApiResponse<TaskCard[]>>('/task-cards'),

  create: (payload: CreateTaskCardPayload) => api.post<ApiResponse<TaskCard>>('/task-cards', payload),

  update: (id: number, payload: UpdateTaskCardPayload) =>
    api.patch<ApiResponse<TaskCard>>(`/task-cards/${id}`, payload),

  remove: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/task-cards/${id}`),
};
