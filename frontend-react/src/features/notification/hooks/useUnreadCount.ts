import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';

/** Polled every 60s — badge count, not critical enough for a websocket. */
export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount().then((res) => res.data!.count),
    refetchInterval: 60_000,
  });
