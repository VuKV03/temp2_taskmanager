import { useQuery } from '@tanstack/react-query';
import { taskListService } from '../services/task-list.service';

export const useLists = (includeArchived = false) =>
  useQuery({
    queryKey: ['lists', { includeArchived }],
    queryFn: () => taskListService.getAll(includeArchived).then((res) => res.data!),
  });
