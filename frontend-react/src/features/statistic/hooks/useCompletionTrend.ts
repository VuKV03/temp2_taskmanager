import { useQuery } from '@tanstack/react-query';
import { statisticService } from '../services/statistic.service';
import type { CompletionParams } from '../types/statistic.types';

export const useCompletionTrend = (params: CompletionParams) =>
  useQuery({
    queryKey: ['stats', 'completion', params],
    queryFn: () => statisticService.getCompletion(params).then((res) => res.data!),
  });
