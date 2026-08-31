export type DrawSourceType = 'task_list' | 'manual';
export type DrawSessionStatus = 'active' | 'completed';

export interface DrawItem {
  id: number;
  taskId: number | null;
  label: string;
  isDrawn: boolean;
  roundNumber: number | null;
  drawnAt: string | null;
}

export interface DrawSession {
  id: number;
  name: string;
  sourceType: DrawSourceType;
  sourceListId: number | null;
  status: DrawSessionStatus;
  totalCount: number;
  remainingCount: number;
  createdAt: string;
}

export interface DrawSessionDetail extends DrawSession {
  items: DrawItem[];
}

export interface DrawResult {
  session: DrawSession;
  drawnItems: DrawItem[];
  requestedCount: number;
  actualCount: number;
}

export interface CreateDrawSessionPayload {
  name: string;
  sourceType: DrawSourceType;
  sourceListId?: number;
  items?: string[];
}

export interface UpdateDrawSessionPayload {
  name?: string;
  addItems?: string[];
  removeItemIds?: number[];
}
