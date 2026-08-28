import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityRepository } from '../repositories/activity.repository.js';
import { Task } from '../../task/entities/task.entity.js';
import { AppException } from '../../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../../shared/constants/error-codes.constant.js';
import { toActivityResponse } from '../types/activity.types.js';
import type { ActivityResponse } from '../types/activity.types.js';
import type { TaskActivity } from '../entities/task-activity.entity.js';
import type { QueryActivityDto, AdminQueryActivityDto } from '../dto/query-activity.dto.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import type { PaginatedMeta } from '../../../shared/dto/pagination-query.dto.js';

export interface PaginatedActivitiesResult {
  data: ActivityResponse[];
  meta: PaginatedMeta;
}

@Injectable()
export class ActivityService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async findMine(user: JwtPayload, query: QueryActivityDto): Promise<PaginatedActivitiesResult> {
    const { items, total } = await this.activityRepository.findMany(user.id, query);
    return this.toPage(items, total, query);
  }

  async findForTask(taskId: number, user: JwtPayload, query: QueryActivityDto): Promise<PaginatedActivitiesResult> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new AppException(ERROR_CODES.TASK_001);
    const isOwner = Number(task.creatorId) === Number(user.id) || Number(task.assigneeId) === Number(user.id);
    if (!isOwner && user.role !== 'admin') throw new AppException(ERROR_CODES.TASK_002);

    const { items, total } = await this.activityRepository.findByTask(taskId, query);
    return this.toPage(items, total, query);
  }

  async findAllAdmin(query: AdminQueryActivityDto): Promise<PaginatedActivitiesResult> {
    const { items, total } = await this.activityRepository.findAllAdmin(query);
    return this.toPage(items, total, query);
  }

  /** Shape `TransformInterceptor` recognizes as paginated: `{ data, meta }` — matches API_SPEC.md. */
  private toPage(items: TaskActivity[], total: number, query: QueryActivityDto): PaginatedActivitiesResult {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      data: items.map(toActivityResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }
}
