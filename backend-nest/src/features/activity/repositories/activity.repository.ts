import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TaskActivity } from '../entities/task-activity.entity.js';
import type { QueryActivityDto, AdminQueryActivityDto } from '../dto/query-activity.dto.js';

@Injectable()
export class ActivityRepository {
  constructor(
    @InjectRepository(TaskActivity)
    private readonly repo: Repository<TaskActivity>,
  ) {}

  private baseQuery(): SelectQueryBuilder<TaskActivity> {
    return this.repo.createQueryBuilder('activity').leftJoinAndSelect('activity.user', 'user');
  }

  private applyFilters(qb: SelectQueryBuilder<TaskActivity>, query: QueryActivityDto): void {
    if (query.action) {
      qb.andWhere('activity.action = :action', { action: query.action });
    }
    if (query.from) {
      qb.andWhere('activity.createdAt >= :from', { from: new Date(`${query.from}T00:00:00.000Z`) });
    }
    if (query.to) {
      qb.andWhere('activity.createdAt <= :to', { to: new Date(`${query.to}T23:59:59.999Z`) });
    }
  }

  private async paginate(
    qb: SelectQueryBuilder<TaskActivity>,
    query: QueryActivityDto,
  ): Promise<{ items: TaskActivity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  findMany(userId: number, query: QueryActivityDto): Promise<{ items: TaskActivity[]; total: number }> {
    const qb = this.baseQuery().where('activity.userId = :userId', { userId });
    this.applyFilters(qb, query);
    return this.paginate(qb, query);
  }

  findByTask(taskId: number, query: QueryActivityDto): Promise<{ items: TaskActivity[]; total: number }> {
    const qb = this.baseQuery().where('activity.taskId = :taskId', { taskId });
    this.applyFilters(qb, query);
    return this.paginate(qb, query);
  }

  findAllAdmin(query: AdminQueryActivityDto): Promise<{ items: TaskActivity[]; total: number }> {
    const qb = this.baseQuery();
    if (query.userId !== undefined) {
      qb.andWhere('activity.userId = :userId', { userId: query.userId });
    }
    this.applyFilters(qb, query);
    return this.paginate(qb, query);
  }
}
