import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';
import type { Task, CreateTaskPayload } from '../types/task.types';

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Task>, ApiError, CreateTaskPayload>({
    mutationFn: (payload) => taskService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Đã tạo công việc');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
