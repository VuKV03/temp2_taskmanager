import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';

/**
 * Bulk "remove from Today" — clears `dueDate` on each task (no bulk endpoint
 * for this, so it fans out over the same single-task `PATCH` the row action
 * uses). Unlike `useBulkDeleteTasks`, this never archives anything: tasks
 * stay fully intact in "Danh sách công việc", just without today's due date.
 */
export const useBulkRemoveFromToday = () => {
  const queryClient = useQueryClient();

  return useMutation<number, ApiError, number[]>({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => taskService.update(id, { dueDate: null })));
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(`Đã bỏ ${count} công việc khỏi Hôm nay`);
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
