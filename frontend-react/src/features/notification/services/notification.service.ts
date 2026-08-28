import { api } from '../../../shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '../../../shared/types/api';
import type { Notification, NotificationParams } from '../types/notification.types';

export const notificationService = {
  getAll: (params: NotificationParams) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markAsRead: (id: number) => api.patch<ApiResponse<{ message: string }>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch<ApiResponse<{ message: string }>>('/notifications/read-all'),
};
