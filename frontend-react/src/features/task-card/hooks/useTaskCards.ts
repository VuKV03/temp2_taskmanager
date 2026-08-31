import { useQuery } from '@tanstack/react-query';
import { taskCardService } from '../services/task-card.service';

export const useTaskCards = () =>
  useQuery({
    queryKey: ['task-cards'],
    queryFn: () => taskCardService.getAll().then((res) => res.data!),
  });
