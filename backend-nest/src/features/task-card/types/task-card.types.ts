import type { TaskCard } from '../entities/task-card.entity.js';

export interface TaskCardResponse {
  id: number;
  name: string;
  sortOrder: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toTaskCardResponse(card: TaskCard, taskCount: number): TaskCardResponse {
  return {
    id: Number(card.id),
    name: card.name,
    sortOrder: card.sortOrder,
    taskCount,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}
