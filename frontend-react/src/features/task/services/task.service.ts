import { api } from '../../../shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '../../../shared/types/api';
import type {
  Task,
  TaskParams,
  CreateTaskPayload,
  UpdateTaskPayload,
  ReorderTaskItem,
  TodayViewData,
  TagSummary,
} from '../types/task.types';

/** Backend expects comma-separated values for multi-select filters (`status=todo,in_progress`). */
function serializeParams(params: TaskParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    out[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return out;
}

export const taskService = {
  getAll: (params: TaskParams) => api.get<PaginatedResponse<Task>>('/tasks', { params: serializeParams(params) }),

  getById: (id: number) => api.get<ApiResponse<Task>>(`/tasks/${id}`),

  create: (payload: CreateTaskPayload) => api.post<ApiResponse<Task>>('/tasks', payload),

  update: (id: number, payload: UpdateTaskPayload) => api.patch<ApiResponse<Task>>(`/tasks/${id}`, payload),

  archive: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/tasks/${id}`),

  updateStatus: (id: number, status: Task['status']) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status }),

  assign: (id: number, assigneeId: number) => api.patch<ApiResponse<Task>>(`/tasks/${id}/assignee`, { assigneeId }),

  reorder: (items: ReorderTaskItem[]) => api.patch<ApiResponse<Task[]>>('/tasks/reorder', { items }),

  replaceTags: (id: number, tagIds: number[]) => api.put<ApiResponse<TagSummary[]>>(`/tasks/${id}/tags`, { tagIds }),

  getToday: () => api.get<ApiResponse<TodayViewData>>('/tasks/today'),

  getOverdue: () => api.get<ApiResponse<Task[]>>('/tasks/overdue'),

  getUpcoming: () => api.get<ApiResponse<Task[]>>('/tasks/upcoming'),
};
