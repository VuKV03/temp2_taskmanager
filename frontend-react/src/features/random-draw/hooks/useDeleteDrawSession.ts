import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { randomDrawService } from '../services/random-draw.service';

export const useDeleteDrawSession = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ message: string }>, ApiError, number>({
    mutationFn: (id) => randomDrawService.remove(id),
    onSuccess: (_data, id) => {
      // Evict the deleted session's detail cache directly instead of a
      // prefix invalidate — invalidating the `['draw-sessions']` prefix
      // would also mark `['draw-sessions', id]` stale and, if its detail
      // view hadn't unmounted yet, trigger a refetch that's guaranteed to
      // 404 (the row no longer exists).
      queryClient.removeQueries({ queryKey: ['draw-sessions', id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['draw-sessions'], exact: true });
      toast.success('Đã xoá phiên bốc thăm');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
