import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activity.service';
import type { ActivityParams } from '../types/activity.types';

/** Used by TaskDetailDrawer's history section. */
export const useTaskActivities = (taskId: number | undefined, params: ActivityParams = {}) =>
  useQuery({
    queryKey: ['activities', 'task', taskId, params],
    queryFn: () => activityService.getForTask(taskId!, params),
    enabled: taskId !== undefined,
  });
