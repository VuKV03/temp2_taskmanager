import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { ActivityLoggerService } from '../../activity/services/activity-logger.service.js';
import { TaskRepository } from '../../task/repositories/task.repository.js';
import { CommentRepository } from '../repositories/comment.repository.js';
import { TaskComment } from '../entities/task-comment.entity.js';
import type { CreateCommentDto } from '../dto/create-comment.dto.js';
import type { UpdateCommentDto } from '../dto/update-comment.dto.js';
import { toCommentResponse } from '../types/collaboration.types.js';
import type { CommentResponse } from '../types/collaboration.types.js';
import type { TaskCommentedEvent } from '../../notification/types/notification-events.types.js';

@Injectable()
export class CommentService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly commentRepository: CommentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly activityLogger: ActivityLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByTask(taskId: number, user: JwtPayload): Promise<CommentResponse[]> {
    await this.getAccessibleTask(taskId, user);
    const comments = await this.commentRepository.findByTask(taskId);
    return comments.map(toCommentResponse);
  }

  async create(taskId: number, user: JwtPayload, dto: CreateCommentDto): Promise<CommentResponse> {
    const task = await this.getAccessibleTask(taskId, user);

    const saved = await this.dataSource.transaction(async (manager) => {
      const comment = manager.getRepository(TaskComment).create({
        taskId,
        userId: user.id,
        content: dto.content,
      });
      const savedComment = await manager.getRepository(TaskComment).save(comment);

      // Business rule: comment creation triggers an activity log entry.
      await this.activityLogger.log(manager, {
        taskId,
        userId: user.id,
        action: 'commented',
        taskTitle: task.title,
      });

      return savedComment;
    });

    const full = await this.commentRepository.findById(saved.id);

    // Notify the other party (creator/assignee) — never the commenter
    // themself. Fire-and-forget, same reasoning as TaskService.assign.
    const recipientIds = [...new Set([Number(task.creatorId), Number(task.assigneeId)])].filter(
      (id) => !Number.isNaN(id) && id !== Number(user.id),
    );
    if (recipientIds.length > 0) {
      this.eventEmitter.emit('task.commented', {
        recipientIds,
        taskId,
        taskTitle: task.title,
        commenterName: full!.user.fullName,
      } satisfies TaskCommentedEvent);
    }

    return toCommentResponse(full!);
  }

  async update(commentId: number, user: JwtPayload, dto: UpdateCommentDto): Promise<CommentResponse> {
    const comment = await this.getOwnComment(commentId, user);
    comment.content = dto.content;
    const saved = await this.commentRepository.save(comment);
    return toCommentResponse(saved);
  }

  async delete(commentId: number, user: JwtPayload): Promise<void> {
    const comment = await this.getOwnComment(commentId, user);
    await this.commentRepository.delete(comment.id);
  }

  private async getAccessibleTask(taskId: number, user: JwtPayload) {
    const task = await this.taskRepository.findByIdBare(taskId);
    if (!task) throw new AppException(ERROR_CODES.TASK_001);
    const isOwner = task.creatorId === user.id || task.assigneeId === user.id;
    if (!isOwner && user.role !== 'admin') throw new AppException(ERROR_CODES.TASK_002);
    return task;
  }

  private async getOwnComment(commentId: number, user: JwtPayload): Promise<TaskComment> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new AppException(ERROR_CODES.CMT_001);
    if (comment.userId !== user.id) throw new AppException(ERROR_CODES.CMT_002);
    return comment;
  }
}
