import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';
import type { TagSummary } from '../types/task.types';

export const useReplaceTags = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TagSummary[]>, ApiError, { id: number; tagIds: number[] }>({
    mutationFn: ({ id, tagIds }) => taskService.replaceTags(id, tagIds),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
