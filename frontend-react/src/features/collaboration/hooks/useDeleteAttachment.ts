import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborationService } from '../services/collaboration.service';

export const useDeleteAttachment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => collaborationService.deleteAttachment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', taskId] }),
  });
};
