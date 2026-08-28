export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

// Allowed next statuses, mirrors backend TASK_STATUS_TRANSITIONS — used to
// grey out invalid options in the status dropdown instead of round-tripping
// a doomed request.
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['todo', 'in_progress', 'done', 'cancelled'],
  in_progress: ['in_progress', 'todo', 'done', 'cancelled'],
  done: ['done', 'todo', 'in_progress', 'cancelled'],
  cancelled: ['cancelled'],
};

export interface TaskListSummary {
  id: number;
  name: string;
  color: string | null;
}

export interface UserSummary {
  id: number;
  fullName: string;
}

export interface TagSummary {
  id: number;
  name: string;
  color: string | null;
}

export interface SubtaskItem {
  id: number;
  title: string;
  status: TaskStatus;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  list: TaskListSummary | null;
  parentTaskId: number | null;
  creator: UserSummary;
  assignee: UserSummary | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  estimateMinutes: number | null;
  recurrenceRule: string | null;
  sortOrder: number;
  isArchived: boolean;
  tags: TagSummary[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
  subtasks?: SubtaskItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskParams {
  page?: number;
  limit?: number;
  sort?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'sortOrder';
  order?: 'asc' | 'desc';
  status?: TaskStatus[];
  priority?: TaskPriority[];
  listId?: number;
  assigneeId?: number;
  tagIds?: number[];
  dueFrom?: string;
  dueTo?: string;
  q?: string;
  includeArchived?: boolean;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  listId?: number | null;
  parentTaskId?: number;
  assigneeId?: number;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimateMinutes?: number;
  recurrenceRule?: string;
  tagIds?: number[];
}

export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, 'parentTaskId'>>;

export interface ReorderTaskItem {
  id: number;
  sortOrder: number;
}

export interface CreateTagPayload {
  name: string;
  color?: string;
}

export type UpdateTagPayload = Partial<CreateTagPayload>;

export interface TodayViewData {
  date: string;
  timezone: string;
  overdue: Task[];
  today: Task[];
  counters: { overdue: number; today: number; completedToday: number };
}
