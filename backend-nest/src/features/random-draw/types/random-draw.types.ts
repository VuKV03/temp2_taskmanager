import type { DrawSession } from '../entities/draw-session.entity.js';
import type { DrawItem } from '../entities/draw-item.entity.js';

export enum DrawSourceType {
  TASK_LIST = 'task_list',
  MANUAL = 'manual',
}

export enum DrawSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface DrawItemResponse {
  id: number;
  taskId: number | null;
  label: string;
  isDrawn: boolean;
  roundNumber: number | null;
  drawnAt: string | null;
}

export interface DrawSessionResponse {
  id: number;
  name: string;
  sourceType: DrawSourceType;
  sourceListId: number | null;
  status: DrawSessionStatus;
  totalCount: number;
  remainingCount: number;
  createdAt: string;
}

export interface DrawSessionDetailResponse extends DrawSessionResponse {
  items: DrawItemResponse[];
}

export interface DrawResultResponse {
  session: DrawSessionResponse;
  drawnItems: DrawItemResponse[];
  requestedCount: number;
  actualCount: number;
}

export function toDrawItemResponse(item: DrawItem): DrawItemResponse {
  return {
    id: Number(item.id),
    taskId: item.taskId !== null ? Number(item.taskId) : null,
    label: item.label,
    isDrawn: item.isDrawn,
    roundNumber: item.roundNumber,
    drawnAt: item.drawnAt ? item.drawnAt.toISOString() : null,
  };
}

export function toDrawSessionResponse(
  session: DrawSession,
  counts: { total: number; drawn: number },
): DrawSessionResponse {
  return {
    id: Number(session.id),
    name: session.name,
    sourceType: session.sourceType,
    sourceListId: session.sourceListId !== null ? Number(session.sourceListId) : null,
    status: session.status,
    totalCount: counts.total,
    remainingCount: counts.total - counts.drawn,
    createdAt: session.createdAt.toISOString(),
  };
}
