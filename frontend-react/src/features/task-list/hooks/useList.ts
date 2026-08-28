import { useQuery } from '@tanstack/react-query';
import { taskListService } from '../services/task-list.service';

export const useList = (id: number | undefined) =>
  useQuery({
    queryKey: ['lists', id],
    queryFn: () => taskListService.getById(id!).then((res) => res.data!),
    enabled: id !== undefined,
  });
