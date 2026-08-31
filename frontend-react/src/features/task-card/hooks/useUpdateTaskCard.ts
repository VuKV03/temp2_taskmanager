import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskCardService } from '../services/task-card.service';
import type { TaskCard, UpdateTaskCardPayload } from '../types/task-card.types';

export const useUpdateTaskCard = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskCard>, ApiError, { id: number; payload: UpdateTaskCardPayload }>({
    mutationFn: ({ id, payload }) => taskCardService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-cards'] });
      toast.success('Đã cập nhật thẻ');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
