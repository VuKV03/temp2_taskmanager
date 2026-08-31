import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { randomDrawService } from '../services/random-draw.service';
import type { DrawSessionDetail, CreateDrawSessionPayload } from '../types/random-draw.types';

export const useCreateDrawSession = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DrawSessionDetail>, ApiError, CreateDrawSessionPayload>({
    mutationFn: (payload) => randomDrawService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draw-sessions'] });
      toast.success('Đã tạo phiên bốc thăm');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
