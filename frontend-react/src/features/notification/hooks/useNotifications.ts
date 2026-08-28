import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import type { NotificationParams } from '../types/notification.types';

export const useNotifications = (params: NotificationParams = {}) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getAll(params),
  });
