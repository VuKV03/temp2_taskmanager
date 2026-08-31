import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validationSchema } from './config/validation.schema.js';
import { DatabaseModule } from './core/database/database.module.js';
import { LoggerModule } from './core/logger/logger.module.js';
import { CacheModule } from './core/cache/cache.module.js';
import { QueueModule } from './core/queue/queue.module.js';
import { StorageModule } from './core/storage/storage.module.js';
import { TelegramModule } from './core/telegram/telegram.module.js';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard.js';
import { RolesGuard } from './shared/guards/roles.guard.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './features/auth/auth.module.js';
import { TaskListModule } from './features/task-list/task-list.module.js';
import { TaskCardModule } from './features/task-card/task-card.module.js';
import { TaskModule } from './features/task/task.module.js';
import { ActivityModule } from './features/activity/activity.module.js';
import { CollaborationModule } from './features/collaboration/collaboration.module.js';
import { NotificationModule } from './features/notification/notification.module.js';
import { StatisticModule } from './features/statistic/statistic.module.js';
import { UserManagementModule } from './features/user-management/user-management.module.js';
import { RandomDrawModule } from './features/random-draw/random-draw.module.js';

@Module({
  imports: [
    // Global config — must be first
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),

    // Core infrastructure modules
    LoggerModule,
    DatabaseModule,
    CacheModule,
    QueueModule,
    StorageModule,
    TelegramModule,

    // Event-driven architecture
    EventEmitterModule.forRoot(),

    // Background job scheduling
    ScheduleModule.forRoot(),

    // Rate limiting — default "còn lại" bucket (100 req/60s/user), auth
    // endpoints override with @Throttle({ default: { limit: 5, ttl: 60000 } })
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Feature modules
    AuthModule,
    TaskListModule,
    TaskCardModule,
    TaskModule,
    ActivityModule,
    CollaborationModule,
    NotificationModule,
    StatisticModule,
    UserManagementModule,
    RandomDrawModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards — protected by default, opt out with @Public().
    // Order: rate limit -> JWT -> role check.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
