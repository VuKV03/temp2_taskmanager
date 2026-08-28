import { useQuery } from '@tanstack/react-query';
import { collaborationService } from '../services/collaboration.service';

export const useComments = (taskId: number | undefined) =>
  useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => collaborationService.getComments(taskId!).then((res) => res.data!),
    enabled: taskId !== undefined,
  });
