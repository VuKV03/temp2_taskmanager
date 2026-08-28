import type { TaskStatus, TaskPriority } from '../../task/types/task.types.js';

export interface StatsRange {
  from: string;
  to: string;
}

export interface StatsTotals {
  created: number;
  completed: number;
  overdue: number;
  inProgress: number;
  completionRate: number;
}

export interface StatusCount {
  status: TaskStatus;
  count: number;
}

export interface PriorityCount {
  priority: TaskPriority;
  count: number;
}

export interface ListCount {
  listId: number;
  name: string;
  total: number;
  completed: number;
}

export interface StatsSummaryResponse {
  range: StatsRange;
  totals: StatsTotals;
  byStatus: StatusCount[];
  byPriority: PriorityCount[];
  byList: ListCount[];
  streakDays: number;
  avgCompletionHours: number;
}

export interface CompletionPoint {
  date: string;
  completed: number;
}

export interface AdminStatsOverview {
  range: StatsRange;
  totals: StatsTotals & { totalUsers: number };
  byStatus: StatusCount[];
  byPriority: PriorityCount[];
}

export interface UserPerformance {
  userId: number;
  fullName: string;
  created: number;
  completed: number;
  completionRate: number;
}
