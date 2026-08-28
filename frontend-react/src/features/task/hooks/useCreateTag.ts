import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { tagService } from '../services/tag.service';
import type { TagSummary, CreateTagPayload } from '../types/task.types';

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TagSummary>, ApiError, CreateTagPayload>({
    mutationFn: (payload) => tagService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
