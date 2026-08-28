import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services/task.service';

export const useTodayTasks = () =>
  useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => taskService.getToday().then((res) => res.data!),
    staleTime: 60 * 1000,
  });
