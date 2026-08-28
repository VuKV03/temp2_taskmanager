import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborationService } from '../services/collaboration.service';

export const useCreateComment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => collaborationService.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      // Comment creation also writes a `task_activities` row — see CONTEXT.md.
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};
