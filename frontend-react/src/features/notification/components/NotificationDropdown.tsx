import { CheckCheck } from 'lucide-react';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const { data, isLoading, isError, refetch } = useNotifications({ limit: 10 });
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="absolute right-0 z-20 mt-1 w-80 rounded-md border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-small font-semibold text-text">Thông báo</span>
        {hasUnread && (
          <button
            onClick={() => markAllAsRead()}
            disabled={isPending}
            className="flex items-center gap-1 text-small text-primary hover:underline disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Đánh dấu đã đọc hết
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isError && <ErrorState description="Không tải được thông báo." onRetry={() => refetch()} />}

        {!isLoading && !isError && notifications.length === 0 && (
          <EmptyState icon="🔔" title="Không có thông báo" description="Bạn chưa có thông báo nào." />
        )}

        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onNavigated={onClose} />
        ))}
      </div>
    </div>
  );
};
