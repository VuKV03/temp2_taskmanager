import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { randomDrawService } from '../services/random-draw.service';
import type { DrawResult } from '../types/random-draw.types';

export const useDraw = (sessionId: number) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DrawResult>, ApiError, number>({
    mutationFn: (count) => randomDrawService.draw(sessionId, count),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['draw-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['draw-sessions', sessionId] });
      const n = res.data!.actualCount;
      toast.success(`Đã bốc ${n} công việc`);
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
