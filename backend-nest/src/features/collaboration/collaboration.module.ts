import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskComment } from './entities/task-comment.entity.js';
import { TaskAttachment } from './entities/task-attachment.entity.js';
import { CommentRepository } from './repositories/comment.repository.js';
import { AttachmentRepository } from './repositories/attachment.repository.js';
import { CommentService } from './services/comment.service.js';
import { AttachmentService } from './services/attachment.service.js';
import { TaskCommentController } from './controllers/task-comment.controller.js';
import { CommentController } from './controllers/comment.controller.js';
import { TaskAttachmentController } from './controllers/task-attachment.controller.js';
import { AttachmentController } from './controllers/attachment.controller.js';
import { TaskModule } from '../task/task.module.js';
import { ActivityModule } from '../activity/activity.module.js';
import { StorageModule } from '../../core/storage/storage.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskComment, TaskAttachment]),
    TaskModule,
    ActivityModule,
    StorageModule,
  ],
  // TaskCommentController/TaskAttachmentController registered before the
  // flat ones so ':id' patterns can't be misread as a collision (they're
  // on different path prefixes — `tasks/:id/...` vs `comments`/`attachments`
  // — but keeping the nesting-first order matches the rest of the codebase).
  controllers: [TaskCommentController, TaskAttachmentController, CommentController, AttachmentController],
  providers: [CommentRepository, AttachmentRepository, CommentService, AttachmentService],
})
export class CollaborationModule {}
