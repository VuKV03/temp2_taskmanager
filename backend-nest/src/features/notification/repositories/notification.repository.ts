import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity.js';
import type { NotificationType } from '../entities/notification.entity.js';
import type { QueryNotificationDto } from '../dto/query-notification.dto.js';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async findMany(userId: number, query: QueryNotificationDto): Promise<{ items: Notification[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.repo.findAndCount({
      where: { userId, ...(query.isRead !== undefined ? { isRead: query.isRead } : {}) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  countUnread(userId: number): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  findById(id: number): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Notification>): Notification {
    return this.repo.create(data);
  }

  save(notification: Notification): Promise<Notification> {
    return this.repo.save(notification);
  }

  async markRead(id: number): Promise<void> {
    await this.repo.update({ id }, { isRead: true });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  /** Dedup check for the cron job — never create a second `due_soon`/`overdue` notif for the same task. */
  async existsForTask(userId: number, taskId: number, type: NotificationType): Promise<boolean> {
    const count = await this.repo.count({ where: { userId, taskId, type } });
    return count > 0;
  }
}
