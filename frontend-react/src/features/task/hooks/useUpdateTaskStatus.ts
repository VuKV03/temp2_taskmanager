import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';
import type { Task, TaskStatus, TodayViewData } from '../types/task.types';
import type { PaginatedResponse } from '../../../shared/types/api';

interface UpdateStatusVars {
  id: number;
  status: TaskStatus;
}

type CachedShape = Task | TodayViewData | PaginatedResponse<Task> | undefined;

/** Patches a task wherever it appears in the `['tasks', ...]` cache tree — detail, list pages, and the today view all cache different shapes. */
function patchTaskInCache(id: number, patch: Partial<Task>) {
  return (old: CachedShape): CachedShape => {
    if (!old) return old;

    if ('id' in old && old.id === id) {
      return { ...old, ...patch };
    }
    if ('data' in old && Array.isArray(old.data)) {
      return { ...old, data: old.data.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
    }
    if ('overdue' in old || 'today' in old) {
      const view = old as TodayViewData;
      return {
        ...view,
        overdue: view.overdue?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        today: view.today?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      };
    }
    return old;
  };
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, UpdateStatusVars, { previous: Array<[readonly unknown[], unknown]> }>({
    mutationFn: ({ id, status }) => taskService.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tasks'] });

      const patch: Partial<Task> = {
        status,
        completedAt: status === 'done' ? new Date().toISOString() : null,
      };
      queryClient.setQueriesData({ queryKey: ['tasks'] }, patchTaskInCache(id, patch));

      return { previous };
    },

    onError: (error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(getErrorMessage(error.code));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};
