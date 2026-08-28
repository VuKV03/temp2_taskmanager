import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { ActivityLoggerService } from '../../activity/services/activity-logger.service.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { Task } from '../entities/task.entity.js';
import { TaskStatus, TASK_STATUS_TRANSITIONS, toTaskResponse } from '../types/task.types.js';
import type { TaskResponse } from '../types/task.types.js';

const DONE_STATUSES = [TaskStatus.DONE, TaskStatus.CANCELLED];

@Injectable()
export class TaskStatusService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly taskRepository: TaskRepository,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async updateStatus(user: JwtPayload, id: number, newStatus: TaskStatus): Promise<TaskResponse> {
    const task = await this.taskRepository.findByIdBare(id);
    if (!task) {
      throw new AppException(ERROR_CODES.TASK_001);
    }

    const isOwner = task.creatorId === user.id || task.assigneeId === user.id;
    if (!isOwner && user.role !== 'admin') {
      throw new AppException(ERROR_CODES.TASK_002);
    }

    const allowedNext = TASK_STATUS_TRANSITIONS[task.status];
    if (!allowedNext.includes(newStatus)) {
      throw new AppException(ERROR_CODES.TASK_003, undefined, { from: task.status, to: newStatus });
    }

    if (newStatus === TaskStatus.DONE) {
      const subtasks = await this.taskRepository.findSubtasks(task.id);
      const unfinished = subtasks.some((s) => !DONE_STATUSES.includes(s.status));
      if (unfinished) {
        throw new AppException(ERROR_CODES.TASK_005);
      }
    }

    const oldStatus = task.status;

    await this.dataSource.transaction(async (manager) => {
      task.status = newStatus;
      if (newStatus === TaskStatus.CANCELLED) {
        task.completedAt = null;
      } else if (newStatus === TaskStatus.DONE) {
        task.completedAt = new Date();
      } else if (oldStatus === TaskStatus.DONE) {
        task.completedAt = null;
      }

      await manager.getRepository(Task).save(task);
      await this.activityLogger.log(manager, {
        taskId: task.id,
        userId: user.id,
        action: 'status_changed',
        taskTitle: task.title,
        fieldName: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
      });
    });

    const full = await this.taskRepository.findById(task.id);
    return toTaskResponse(full!);
  }
}
