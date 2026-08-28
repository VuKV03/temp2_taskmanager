import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '../../../shared/lib/axios';
import { taskListService } from '../services/task-list.service';
import type { TaskList, ReorderListItem } from '../types/task-list.types';

interface ReorderContext {
  previous: Array<[readonly unknown[], TaskList[] | undefined]>;
}

export const useReorderLists = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, ReorderListItem[], ReorderContext>({
    mutationFn: (items) => taskListService.reorder(items),

    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['lists'] });
      const previous = queryClient.getQueriesData<TaskList[]>({ queryKey: ['lists'] });

      const order = new Map(items.map((item) => [item.id, item.sortOrder]));
      queryClient.setQueriesData<TaskList[]>({ queryKey: ['lists'] }, (old) =>
        old
          ?.map((list) => (order.has(list.id) ? { ...list, sortOrder: order.get(list.id)! } : list))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      );

      return { previous };
    },

    onError: (_err, _items, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Không sắp xếp lại được danh sách');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
};
