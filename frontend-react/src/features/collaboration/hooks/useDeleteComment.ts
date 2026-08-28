import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborationService } from '../services/collaboration.service';

export const useDeleteComment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => collaborationService.deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
  });
};
