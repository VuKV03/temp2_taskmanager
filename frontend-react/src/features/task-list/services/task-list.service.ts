import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  TaskList,
  TaskListDetail,
  CreateTaskListPayload,
  UpdateTaskListPayload,
  ReorderListItem,
} from '../types/task-list.types';

export const taskListService = {
  getAll: (includeArchived = false) =>
    api.get<ApiResponse<TaskList[]>>('/lists', { params: { includeArchived } }),

  getById: (id: number) => api.get<ApiResponse<TaskListDetail>>(`/lists/${id}`),

  create: (payload: CreateTaskListPayload) => api.post<ApiResponse<TaskList>>('/lists', payload),

  update: (id: number, payload: UpdateTaskListPayload) =>
    api.patch<ApiResponse<TaskList>>(`/lists/${id}`, payload),

  archive: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/lists/${id}`),

  reorder: (items: ReorderListItem[]) => api.patch<ApiResponse<TaskList[]>>('/lists/reorder', { items }),
};
