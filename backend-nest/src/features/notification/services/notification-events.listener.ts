import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from '../../auth/repositories/user.repository.js';
import { TelegramService } from '../../../core/telegram/telegram.service.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import type { TaskAssignedEvent, TaskCommentedEvent } from '../types/notification-events.types.js';

/**
 * Listens for events emitted by `task` (assignment) and `collaboration`
 * (comments) — see `notification-events.types.ts`. Non-critical: a failure
 * here is logged and swallowed, never bubbled back to the request that
 * triggered it (CONTEXT.md: "loss is acceptable").
 */
@Injectable()
export class NotificationEventsListener {
  private readonly logger = new Logger(NotificationEventsListener.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
    private readonly telegramService: TelegramService,
  ) {}

  @OnEvent('task.assigned')
  async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    const message = `Bạn được gán công việc "${event.taskTitle}"`;
    try {
      const notification = this.notificationRepository.create({
        userId: event.userId,
        taskId: event.taskId,
        type: 'assigned',
        message,
      });
      await this.notificationRepository.save(notification);
    } catch (err) {
      this.logger.warn(`Failed to create 'assigned' notification: ${(err as Error).message}`);
    }
    await this.notifyTelegram(event.userId, `📌 ${message}`);
  }

  @OnEvent('task.commented')
  async handleTaskCommented(event: TaskCommentedEvent): Promise<void> {
    const message = `${event.commenterName} đã bình luận vào công việc "${event.taskTitle}"`;
    try {
      const notifications = event.recipientIds.map((userId) =>
        this.notificationRepository.create({
          userId,
          taskId: event.taskId,
          type: 'commented',
          message,
        }),
      );
      await Promise.all(notifications.map((n) => this.notificationRepository.save(n)));
    } catch (err) {
      this.logger.warn(`Failed to create 'commented' notification: ${(err as Error).message}`);
    }
    await Promise.all(event.recipientIds.map((userId) => this.notifyTelegram(userId, `💬 ${message}`)));
  }

  /** Best-effort — same "never break the caller" tolerance as the DB write above (CONTEXT.md rule #5). */
  private async notifyTelegram(userId: number, text: string): Promise<void> {
    if (!this.telegramService.isConfigured) return;
    try {
      const user = await this.userRepository.findById(userId);
      if (user?.telegramChatId) {
        await this.telegramService.sendMessage(user.telegramChatId, text);
      }
    } catch (err) {
      this.logger.warn(`Failed to send Telegram notification to user ${userId}: ${(err as Error).message}`);
    }
  }
}
