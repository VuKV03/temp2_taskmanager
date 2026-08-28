import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '../../../shared/lib/axios';
import type { PaginatedResponse } from '../../../shared/types/api';
import { taskService } from '../services/task.service';
import type { Task, ReorderTaskItem } from '../types/task.types';

export const useReorderTasks = () => {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    ApiError,
    ReorderTaskItem[],
    { previous: Array<[readonly unknown[], unknown]> }
  >({
    mutationFn: (items) => taskService.reorder(items),

    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tasks'] });

      const order = new Map(items.map((item) => [item.id, item.sortOrder]));
      queryClient.setQueriesData<PaginatedResponse<Task> | undefined>({ queryKey: ['tasks'] }, (old) => {
        if (!old || !Array.isArray(old.data)) return old;
        return {
          ...old,
          data: old.data
            .map((t) => (order.has(t.id) ? { ...t, sortOrder: order.get(t.id)! } : t))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        };
      });

      return { previous };
    },

    onError: (_err, _items, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Không sắp xếp lại được công việc');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
