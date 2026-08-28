import { useQuery } from '@tanstack/react-query';
import { statisticService } from '../services/statistic.service';
import type { StatsParams } from '../types/statistic.types';

export const useStatsSummary = (params: StatsParams) =>
  useQuery({
    queryKey: ['stats', 'summary', params],
    queryFn: () => statisticService.getSummary(params).then((res) => res.data!),
  });
