import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskCardService } from '../services/task-card.service';
import type { TaskCard, CreateTaskCardPayload } from '../types/task-card.types';

export const useCreateTaskCard = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskCard>, ApiError, CreateTaskCardPayload>({
    mutationFn: (payload) => taskCardService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-cards'] });
      toast.success('Đã tạo thẻ');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
