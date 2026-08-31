export interface TaskCard {
  id: number;
  name: string;
  sortOrder: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskCardPayload {
  name: string;
}

export type UpdateTaskCardPayload = Partial<CreateTaskCardPayload>;
