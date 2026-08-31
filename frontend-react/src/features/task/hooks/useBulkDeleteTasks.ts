import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';

export const useBulkDeleteTasks = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ message: string; archivedCount: number }>, ApiError, number[]>({
    mutationFn: (ids) => taskService.bulkArchive(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      // Archiving drops out of its card's `taskCount` (counted rows are `is_archived = 0`).
      queryClient.invalidateQueries({ queryKey: ['task-cards'] });
      toast.success(`Đã xoá ${res.data?.archivedCount ?? 0} công việc`);
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
