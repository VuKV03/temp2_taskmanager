import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import type { TaskParams } from '../types/task.types';

export const useTasks = (params: TaskParams) =>
  useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getAll(params),
  });
