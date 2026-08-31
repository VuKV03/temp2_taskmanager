import { useQuery } from '@tanstack/react-query';
import { randomDrawService } from '../services/random-draw.service';

export const useDrawSessions = () =>
  useQuery({
    queryKey: ['draw-sessions'],
    queryFn: () => randomDrawService.getAll().then((res) => res.data!),
  });
