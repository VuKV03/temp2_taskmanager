import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { TaskRepository } from '../../task/repositories/task.repository.js';
import { TelegramService } from '../../../core/telegram/telegram.service.js';
import { NotificationRepository } from '../repositories/notification.repository.js';

const LOOKAHEAD_HOURS = 48; // generous UTC prefetch; see TaskRepository.findNotificationCandidates

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly telegramService: TelegramService,
  ) {}

  /** Every 15 minutes: due-soon + overdue notifications (CONTEXT.md Triggers). */
  @Cron('0 */15 * * * *')
  async handleCron(): Promise<void> {
    const now = new Date();
    const candidates = await this.taskRepository.findNotificationCandidates(now, LOOKAHEAD_HOURS);

    for (const task of candidates) {
      if (!task.assignee || !task.dueDate) continue;
      const timezone = task.assignee.timezone;
      const nowInTz = DateTime.now().setZone(timezone);
      const startOfToday = nowInTz.startOf('day');
      const endOfTomorrow = nowInTz.plus({ days: 1 }).endOf('day');
      const dueDate = DateTime.fromJSDate(task.dueDate).setZone(timezone);

      try {
        if (dueDate < startOfToday) {
          await this.notifyOnce(
            task.assignee.id,
            task.id,
            'overdue',
            `Công việc "${task.title}" đã quá hạn`,
            task.assignee.telegramChatId,
          );
        } else if (dueDate <= endOfTomorrow) {
          await this.notifyOnce(
            task.assignee.id,
            task.id,
            'due_soon',
            `Công việc "${task.title}" sắp đến hạn`,
            task.assignee.telegramChatId,
          );
        }
      } catch (err) {
        // Non-critical — one bad row must not stop the rest of the batch.
        this.logger.warn(`Failed to notify for task ${task.id}: ${(err as Error).message}`);
      }
    }
  }

  private async notifyOnce(
    userId: number,
    taskId: number,
    type: 'due_soon' | 'overdue',
    message: string,
    telegramChatId: string | null,
  ): Promise<void> {
    const exists = await this.notificationRepository.existsForTask(userId, taskId, type);
    if (exists) return; // dedup — CONTEXT.md: "don't create duplicate overdue notif for same task"
    const notification = this.notificationRepository.create({ userId, taskId, type, message });
    await this.notificationRepository.save(notification);

    // Best-effort — a lost Telegram send must never break the cron batch,
    // same tolerance as the DB write above.
    if (telegramChatId && this.telegramService.isConfigured) {
      try {
        await this.telegramService.sendMessage(telegramChatId, `⏰ ${message}`);
      } catch (err) {
        this.logger.warn(`Failed to send Telegram ${type} notification to user ${userId}: ${(err as Error).message}`);
      }
    }
  }
}
