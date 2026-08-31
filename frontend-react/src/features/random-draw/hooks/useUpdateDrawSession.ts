import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { randomDrawService } from '../services/random-draw.service';
import type { DrawSessionDetail, UpdateDrawSessionPayload } from '../types/random-draw.types';

export const useUpdateDrawSession = (sessionId: number) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DrawSessionDetail>, ApiError, UpdateDrawSessionPayload>({
    mutationFn: (payload) => randomDrawService.update(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draw-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['draw-sessions', sessionId] });
      toast.success('Đã cập nhật phiên bốc thăm');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
