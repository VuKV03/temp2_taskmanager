import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskListService } from '../services/task-list.service';
import type { TaskList, UpdateTaskListPayload } from '../types/task-list.types';

export const useUpdateList = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskList>, ApiError, { id: number; payload: UpdateTaskListPayload }>({
    mutationFn: ({ id, payload }) => taskListService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Đã cập nhật danh sách');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
