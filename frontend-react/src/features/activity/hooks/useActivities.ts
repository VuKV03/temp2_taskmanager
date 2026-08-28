import { useInfiniteQuery } from '@tanstack/react-query';
import { activityService } from '../services/activity.service';
import type { ActivityParams } from '../types/activity.types';

/** Personal history, infinite scroll — see FE-ARCHITECTURE.md Query Key Conventions. */
export const useActivities = (params: Omit<ActivityParams, 'page'>) =>
  useInfiniteQuery({
    queryKey: ['activities', params],
    queryFn: ({ pageParam }) => activityService.getMine({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
