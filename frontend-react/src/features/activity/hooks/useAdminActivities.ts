import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activity.service';
import type { AdminActivityParams } from '../types/activity.types';

/** System-wide history for the admin page — page-based, not infinite scroll (table + pager UX). */
export const useAdminActivities = (params: AdminActivityParams) =>
  useQuery({
    queryKey: ['activities', 'admin', params],
    queryFn: () => activityService.getAllAdmin(params),
  });
