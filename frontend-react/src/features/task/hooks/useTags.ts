import { useQuery } from '@tanstack/react-query';
import { tagService } from '../services/tag.service';

export const useTags = () =>
  useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getAll().then((res) => res.data!),
    staleTime: 5 * 60 * 1000,
  });
