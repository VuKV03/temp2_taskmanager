import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ message: string }>, ApiError, number>({
    mutationFn: (id) => taskService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      // Archiving drops out of its card's `taskCount` (counted rows are `is_archived = 0`).
      queryClient.invalidateQueries({ queryKey: ['task-cards'] });
      toast.success('Đã xoá công việc');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
