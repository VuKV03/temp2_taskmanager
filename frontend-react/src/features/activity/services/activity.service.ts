import { api } from '../../../shared/lib/axios';
import type { PaginatedResponse } from '../../../shared/types/api';
import type { Activity, ActivityParams, AdminActivityParams } from '../types/activity.types';

export const activityService = {
  getMine: (params: ActivityParams) =>
    api.get<PaginatedResponse<Activity>>('/activities', { params }),

  getForTask: (taskId: number, params: ActivityParams) =>
    api.get<PaginatedResponse<Activity>>(`/tasks/${taskId}/activities`, { params }),

  getAllAdmin: (params: AdminActivityParams) =>
    api.get<PaginatedResponse<Activity>>('/admin/activities', { params }),
};
