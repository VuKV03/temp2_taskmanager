import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services/task.service';

export const useTask = (id: number | undefined) =>
  useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getById(id!).then((res) => res.data!),
    enabled: id !== undefined,
  });
