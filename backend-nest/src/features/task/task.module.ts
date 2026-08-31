import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Task } from './entities/task.entity.js';
import { Tag } from './entities/tag.entity.js';
import { TaskRepository } from './repositories/task.repository.js';
import { TagRepository } from './repositories/tag.repository.js';
import { TaskService } from './services/task.service.js';
import { TaskStatusService } from './services/task-status.service.js';
import { TaskViewService } from './services/task-view.service.js';
import { TaskTagService } from './services/task-tag.service.js';
import { TaskRecurrenceService } from './services/task-recurrence.service.js';
import { RecurringTaskProcessor, RECURRING_TASKS_QUEUE } from './processors/recurring-task.processor.js';
import { TaskController } from './controllers/task.controller.js';
import { TaskViewController } from './controllers/task-view.controller.js';
import { TagController } from './controllers/tag.controller.js';
import { AdminTaskController } from './controllers/admin-task.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskListModule } from '../task-list/task-list.module.js';
import { TaskCardModule } from '../task-card/task-card.module.js';
import { ActivityModule } from '../activity/activity.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Tag]),
    AuthModule,
    TaskListModule,
    TaskCardModule,
    ActivityModule,
    BullModule.registerQueue({ name: RECURRING_TASKS_QUEUE }),
  ],
  // TaskViewController registered before TaskController so its static
  // 'today' / 'overdue' / 'upcoming' routes aren't shadowed by ':id'.
  controllers: [TaskViewController, TagController, AdminTaskController, TaskController],
  providers: [
    TaskRepository,
    TagRepository,
    TaskService,
    TaskStatusService,
    TaskViewService,
    TaskTagService,
    TaskRecurrenceService,
    RecurringTaskProcessor,
  ],
  exports: [TypeOrmModule, TaskRepository],
})
export class TaskModule {}
