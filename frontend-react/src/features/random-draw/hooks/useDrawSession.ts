import { useQuery } from '@tanstack/react-query';
import { randomDrawService } from '../services/random-draw.service';

export const useDrawSession = (id: number | undefined) =>
  useQuery({
    queryKey: ['draw-sessions', id],
    queryFn: () => randomDrawService.getById(id as number).then((res) => res.data!),
    enabled: id !== undefined,
  });
