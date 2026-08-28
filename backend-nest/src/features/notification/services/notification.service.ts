import { Injectable } from '@nestjs/common';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { toNotificationResponse } from '../types/notification.types.js';
import type { NotificationResponse } from '../types/notification.types.js';
import type { QueryNotificationDto } from '../dto/query-notification.dto.js';
import type { PaginatedMeta } from '../../../shared/dto/pagination-query.dto.js';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async findMany(userId: number, query: QueryNotificationDto): Promise<{ data: NotificationResponse[]; meta: PaginatedMeta }> {
    const { items, total } = await this.notificationRepository.findMany(userId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return { data: items.map(toNotificationResponse), meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 } };
  }

  async unreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markRead(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    // Same 404 for "doesn't exist" and "not yours" — don't leak whether a
    // notification with this id exists for someone else.
    if (!notification || notification.userId !== userId) throw new AppException(ERROR_CODES.NOTIF_001);
    await this.notificationRepository.markRead(id);
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notificationRepository.markAllRead(userId);
  }
}
