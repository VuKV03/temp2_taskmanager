export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export const TASK_SORT_FIELDS = ['dueDate', 'priority', 'createdAt', 'updatedAt', 'sortOrder'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

// Task Status Flow — see API_SPEC.md "Task Status Flow". `cancelled` is a
// dead end: create a new task instead of reopening one (TASK_003).
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE, TaskStatus.CANCELLED],
  [TaskStatus.DONE]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.CANCELLED]: [],
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

export interface SubtaskCounts {
  total: number;
  completed: number;
}

export interface SubtaskItem {
  id: number;
  title: string;
  status: TaskStatus;
}

export interface TaskResponse {
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
  /** Only populated on the detail endpoint (`GET /tasks/:id`) — see TaskService.findOne. */
  subtasks?: SubtaskItem[];
  createdAt: string;
  updatedAt: string;
}

export function toTaskResponse(
  task: import('../entities/task.entity.js').Task,
  subtaskCounts?: SubtaskCounts,
  subtasks?: import('../entities/task.entity.js').Task[],
): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    list: task.list ? { id: task.list.id, name: task.list.name, color: task.list.color } : null,
    parentTaskId: task.parentTaskId,
    creator: { id: task.creator.id, fullName: task.creator.fullName },
    assignee: task.assignee ? { id: task.assignee.id, fullName: task.assignee.fullName } : null,
    startDate: task.startDate ? task.startDate.toISOString() : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    estimateMinutes: task.estimateMinutes,
    recurrenceRule: task.recurrenceRule,
    sortOrder: task.sortOrder,
    isArchived: task.isArchived,
    tags: (task.tags ?? []).map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
    subtaskCount: subtaskCounts?.total,
    completedSubtaskCount: subtaskCounts?.completed,
    subtasks: subtasks?.map((s) => ({ id: s.id, title: s.title, status: s.status })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
