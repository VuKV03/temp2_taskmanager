export interface TaskList {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListDetail extends TaskList {
  taskCount: number;
}

export interface CreateTaskListPayload {
  name: string;
  description?: string;
  color?: string;
}

export type UpdateTaskListPayload = Partial<CreateTaskListPayload>;

export interface ReorderListItem {
  id: number;
  sortOrder: number;
}
