import { useQuery } from '@tanstack/react-query';
import { collaborationService } from '../services/collaboration.service';

export const useAttachments = (taskId: number | undefined) =>
  useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => collaborationService.getAttachments(taskId!).then((res) => res.data!),
    enabled: taskId !== undefined,
  });
