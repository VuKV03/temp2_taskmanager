import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { collaborationService } from '../services/collaboration.service';
import type { Attachment } from '../types/collaboration.types';

export const useUploadAttachments = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Attachment[]>, ApiError, File[]>({
    mutationFn: (files) => collaborationService.uploadAttachments(taskId, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', taskId] }),
  });
};
