import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskService } from '../services/task.service';
import type { Task, UpdateTaskPayload } from '../types/task.types';

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Task>, ApiError, { id: number; payload: UpdateTaskPayload }>({
    mutationFn: ({ id, payload }) => taskService.update(id, payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      // `cardId` may have moved (or been cleared) — a card's `taskCount` needs to move with it.
      queryClient.invalidateQueries({ queryKey: ['task-cards'] });
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
