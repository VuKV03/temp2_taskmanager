export type NotificationType = 'due_soon' | 'overdue' | 'assigned' | 'commented';

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  due_soon: 'Sắp đến hạn',
  overdue: 'Quá hạn',
  assigned: 'Được gán việc',
  commented: 'Bình luận',
};

export interface Notification {
  id: number;
  taskId: number | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}
