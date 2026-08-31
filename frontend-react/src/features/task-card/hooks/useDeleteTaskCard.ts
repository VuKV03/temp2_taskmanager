import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskCardService } from '../services/task-card.service';

export const useDeleteTaskCard = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ message: string }>, ApiError, number>({
    mutationFn: (id) => taskCardService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-cards'] });
      // Deleting a card unlinks its tasks (`card_id` -> NULL) — any open
      // task list filtered by this card needs to refetch to reflect that.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Đã xoá thẻ');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
