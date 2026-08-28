import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  StatsSummary,
  CompletionPoint,
  StatusCount,
  PriorityCount,
  AdminStatsOverview,
  UserPerformance,
  StatsParams,
  CompletionParams,
} from '../types/statistic.types';

export const statisticService = {
  getSummary: (params: StatsParams) => api.get<ApiResponse<StatsSummary>>('/stats/summary', { params }),
  getCompletion: (params: CompletionParams) =>
    api.get<ApiResponse<CompletionPoint[]>>('/stats/completion', { params }),
  getByStatus: (params: StatsParams) => api.get<ApiResponse<StatusCount[]>>('/stats/by-status', { params }),
  getByPriority: (params: StatsParams) => api.get<ApiResponse<PriorityCount[]>>('/stats/by-priority', { params }),

  getAdminOverview: (params: StatsParams) =>
    api.get<ApiResponse<AdminStatsOverview>>('/admin/stats/overview', { params }),
  getAdminByUser: (params: StatsParams) =>
    api.get<ApiResponse<UserPerformance[]>>('/admin/stats/by-user', { params }),
};
