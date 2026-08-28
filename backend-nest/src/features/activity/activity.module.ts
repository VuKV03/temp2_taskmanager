import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskActivity } from './entities/task-activity.entity.js';
import { Task } from '../task/entities/task.entity.js';
import { ActivityLoggerService } from './services/activity-logger.service.js';
import { ActivityRepository } from './repositories/activity.repository.js';
import { ActivityService } from './services/activity.service.js';
import { ActivityController } from './controllers/activity.controller.js';
import { AdminActivityController } from './controllers/admin-activity.controller.js';

/**
 * Read side (`GET /activities`, `GET /tasks/:id/activities`,
 * `GET /admin/activities`) added on top of the append-only write path.
 * `Task` is registered here (not `TaskModule`) purely so
 * `ActivityService.findForTask` can do its ownership check with a plain
 * `Repository<Task>` — `task` already imports `ActivityModule`, so pulling
 * in the whole `TaskModule` here would create a module cycle.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TaskActivity, Task])],
  controllers: [ActivityController, AdminActivityController],
  providers: [ActivityLoggerService, ActivityRepository, ActivityService],
  exports: [ActivityLoggerService],
})
export class ActivityModule {}
