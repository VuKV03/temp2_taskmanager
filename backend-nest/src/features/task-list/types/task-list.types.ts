import type { TaskList } from '../entities/task-list.entity.js';

export interface TaskListResponse {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListDetailResponse extends TaskListResponse {
  taskCount: number;
}

export function toTaskListResponse(list: TaskList): TaskListResponse {
  return {
    id: list.id,
    name: list.name,
    description: list.description,
    color: list.color,
    sortOrder: list.sortOrder,
    isArchived: list.isArchived,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}
