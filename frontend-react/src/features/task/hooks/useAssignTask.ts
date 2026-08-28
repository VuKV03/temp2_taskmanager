import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';

/** Admin only — server enforces via `@Roles('admin')` on `PATCH /tasks/:id/assignee`. */
export const useAssignTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: number; assigneeId: number }) => taskService.assign(id, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};
