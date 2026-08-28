import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Clock, AlertTriangle, UserPlus, MessageSquare } from 'lucide-react';
import { getTimeAgo } from '../../../shared/lib/datetime';
import { ROUTES } from '../../../routes/routes';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import type { Notification, NotificationType } from '../types/notification.types';

const TYPE_ICON: Record<NotificationType, ReactNode> = {
  due_soon: <Clock className="h-4 w-4" />,
  overdue: <AlertTriangle className="h-4 w-4" />,
  assigned: <UserPlus className="h-4 w-4" />,
  commented: <MessageSquare className="h-4 w-4" />,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  due_soon: 'bg-status-in-progress text-status-in-progress-text',
  overdue: 'bg-status-cancelled text-priority-urgent',
  assigned: 'bg-status-done text-status-done-text',
  commented: 'bg-status-in-progress text-status-in-progress-text',
};

interface NotificationItemProps {
  notification: Notification;
  onNavigated?: () => void;
}

export const NotificationItem = ({ notification, onNavigated }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { mutate: markAsRead } = useMarkAsRead();

  const handleClick = () => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.taskId !== null) {
      navigate(ROUTES.TASK_DETAIL.replace(':id', String(notification.taskId)));
    }
    onNavigated?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-background ${
        notification.isRead ? '' : 'bg-primary/5'
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[notification.type]}`}
        aria-hidden="true"
      >
        {TYPE_ICON[notification.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-small text-text ${notification.isRead ? '' : 'font-medium'}`}>{notification.message}</p>
        <p className="text-small text-text-muted">{getTimeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" />
      )}
    </button>
  );
};
