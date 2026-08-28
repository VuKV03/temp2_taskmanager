import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
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

  constructor(private readonly notificationRepository: NotificationRepository) {}

  @OnEvent('task.assigned')
  async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    try {
      const notification = this.notificationRepository.create({
        userId: event.userId,
        taskId: event.taskId,
        type: 'assigned',
        message: `Bạn được gán công việc "${event.taskTitle}"`,
      });
      await this.notificationRepository.save(notification);
    } catch (err) {
      this.logger.warn(`Failed to create 'assigned' notification: ${(err as Error).message}`);
    }
  }

  @OnEvent('task.commented')
  async handleTaskCommented(event: TaskCommentedEvent): Promise<void> {
    try {
      const notifications = event.recipientIds.map((userId) =>
        this.notificationRepository.create({
          userId,
          taskId: event.taskId,
          type: 'commented',
          message: `${event.commenterName} đã bình luận vào công việc "${event.taskTitle}"`,
        }),
      );
      await Promise.all(notifications.map((n) => this.notificationRepository.save(n)));
    } catch (err) {
      this.logger.warn(`Failed to create 'commented' notification: ${(err as Error).message}`);
    }
  }
}
