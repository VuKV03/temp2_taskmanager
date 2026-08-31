import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity.js';
import { NotificationRepository } from './repositories/notification.repository.js';
import { NotificationService } from './services/notification.service.js';
import { NotificationEventsListener } from './services/notification-events.listener.js';
import { NotificationCronService } from './services/notification-cron.service.js';
import { NotificationController } from './controllers/notification.controller.js';
import { TaskModule } from '../task/task.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TelegramModule } from '../../core/telegram/telegram.module.js';

/**
 * No `forwardRef` needed here — unlike `activity`, `task`/`collaboration`
 * never import `notification`. They only `EventEmitter2.emit(...)`
 * (`task.assigned`, `task.commented`); `NotificationEventsListener` is the
 * only consumer. `TaskModule` is imported solely for `TaskRepository`,
 * used by the cron job to find due-soon/overdue tasks. `AuthModule` is for
 * `UserRepository` (look up a recipient's `telegramChatId` off the event
 * payload's bare `userId`) and `TelegramModule` for the actual send.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification]), TaskModule, AuthModule, TelegramModule],
  controllers: [NotificationController],
  providers: [NotificationRepository, NotificationService, NotificationEventsListener, NotificationCronService],
})
export class NotificationModule {}
