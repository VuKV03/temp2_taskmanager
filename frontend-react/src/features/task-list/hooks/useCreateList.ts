import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskListService } from '../services/task-list.service';
import type { TaskList, CreateTaskListPayload } from '../types/task-list.types';

export const useCreateList = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskList>, ApiError, CreateTaskListPayload>({
    mutationFn: (payload) => taskListService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Đã tạo danh sách');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
