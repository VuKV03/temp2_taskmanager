import { useQuery } from '@tanstack/react-query';
import { statisticService } from '../services/statistic.service';
import type { StatsParams } from '../types/statistic.types';

export const useAdminStatsOverview = (params: StatsParams) =>
  useQuery({
    queryKey: ['stats', 'admin', 'overview', params],
    queryFn: () => statisticService.getAdminOverview(params).then((res) => res.data!),
  });

export const useAdminStatsByUser = (params: StatsParams) =>
  useQuery({
    queryKey: ['stats', 'admin', 'by-user', params],
    queryFn: () => statisticService.getAdminByUser(params).then((res) => res.data!),
  });
