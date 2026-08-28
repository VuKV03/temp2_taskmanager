import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from '../../task/entities/task.entity.js';
import { TaskStatus } from '../../task/types/task.types.js';
import { User } from '../../auth/entities/user.entity.js';

const DONE_STATUSES = [TaskStatus.DONE, TaskStatus.CANCELLED];

export interface UserPerformanceRow {
  userId: string;
  fullName: string;
  created: string;
  completed: string;
  cancelled: string;
}

@Injectable()
export class StatsRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  /**
   * Scoped counts/aggregates below intentionally do NOT filter
   * `is_archived` — DATABASE.md business rule #4: soft-deleting a task
   * ("Xoá task") must preserve statistics integrity. Only the two
   * *current-state* snapshots (`countOverdue`, `countInProgress`) exclude
   * archived tasks, matching how the rest of the app treats "live" views
   * (today/overdue) — see `task/repositories/task.repository.ts`.
   */
  private scopedQuery(userId: number | null): SelectQueryBuilder<Task> {
    const qb = this.repo.createQueryBuilder('task');
    if (userId !== null) qb.where('task.assigneeId = :userId', { userId });
    return qb;
  }

  countCreated(userId: number | null, start: Date, end: Date): Promise<number> {
    return this.scopedQuery(userId)
      .andWhere('task.createdAt BETWEEN :start AND :end', { start, end })
      .getCount();
  }

  countCompleted(userId: number | null, start: Date, end: Date): Promise<number> {
    return this.scopedQuery(userId)
      .andWhere('task.completedAt BETWEEN :start AND :end', { start, end })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .getCount();
  }

  countCancelledCreated(userId: number | null, start: Date, end: Date): Promise<number> {
    return this.scopedQuery(userId)
      .andWhere('task.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('task.status = :status', { status: TaskStatus.CANCELLED })
      .getCount();
  }

  /** Live snapshot, not range-bound — excludes archived, same as the "today"/"overdue" views. */
  countOverdue(userId: number | null, todayStart: Date): Promise<number> {
    return this.scopedQuery(userId)
      .andWhere('task.dueDate < :todayStart', { todayStart })
      .andWhere('task.status NOT IN (:...done)', { done: DONE_STATUSES })
      .andWhere('task.isArchived = false')
      .getCount();
  }

  /** Live snapshot, not range-bound — excludes archived. */
  countInProgress(userId: number | null): Promise<number> {
    return this.scopedQuery(userId)
      .andWhere('task.status = :status', { status: TaskStatus.IN_PROGRESS })
      .andWhere('task.isArchived = false')
      .getCount();
  }

  async byStatus(userId: number | null, start: Date, end: Date): Promise<{ status: string; count: string }[]> {
    return this.scopedQuery(userId)
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .andWhere('task.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('task.status')
      .getRawMany();
  }

  async byPriority(userId: number | null, start: Date, end: Date): Promise<{ priority: string; count: string }[]> {
    return this.scopedQuery(userId)
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .andWhere('task.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('task.priority')
      .getRawMany();
  }

  async byList(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<{ listId: string; name: string; total: string; completed: string }[]> {
    return this.repo
      .createQueryBuilder('task')
      .innerJoin('task.list', 'list')
      .select('list.id', 'listId')
      .addSelect('list.name', 'name')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN task.status = :done THEN 1 ELSE 0 END)', 'completed')
      .where('task.assigneeId = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :start AND :end', { start, end })
      .setParameter('done', TaskStatus.DONE)
      .groupBy('list.id')
      .addGroupBy('list.name')
      .getRawMany();
  }

  /** Average hours from `created_at` to `completed_at` — rule #2: `completed_at` is the sole source of truth. */
  async avgCompletionHours(userId: number | null, start: Date, end: Date): Promise<number | null> {
    const row = await this.scopedQuery(userId)
      .select('AVG(TIMESTAMPDIFF(MINUTE, task.createdAt, task.completedAt))', 'avgMinutes')
      .andWhere('task.completedAt BETWEEN :start AND :end', { start, end })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .getRawOne<{ avgMinutes: string | null }>();
    return row?.avgMinutes ? Number(row.avgMinutes) / 60 : null;
  }

  /** Distinct completion dates (as UTC midnight timestamps) — bucketed into the caller's timezone by the service. */
  async completedDates(userId: number | null, start: Date, end: Date): Promise<Date[]> {
    const rows = await this.scopedQuery(userId)
      .select('task.completedAt', 'completedAt')
      .andWhere('task.completedAt BETWEEN :start AND :end', { start, end })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .getRawMany<{ completedAt: Date }>();
    return rows.map((r) => r.completedAt);
  }

  /** Every distinct completion timestamp ever (for the streak calculation — not range-bound). */
  async allCompletedDates(userId: number): Promise<Date[]> {
    const rows = await this.repo
      .createQueryBuilder('task')
      .select('task.completedAt', 'completedAt')
      .where('task.assigneeId = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .getRawMany<{ completedAt: Date }>();
    return rows.map((r) => r.completedAt);
  }

  countUsers(): Promise<number> {
    return this.repo.manager.getRepository(User).count();
  }

  async byUserPerformance(start: Date, end: Date): Promise<UserPerformanceRow[]> {
    return this.repo
      .createQueryBuilder('task')
      .innerJoin('task.assignee', 'assignee')
      .select('assignee.id', 'userId')
      .addSelect('assignee.fullName', 'fullName')
      .addSelect('COUNT(*)', 'created')
      .addSelect('SUM(CASE WHEN task.status = :done THEN 1 ELSE 0 END)', 'completed')
      .addSelect('SUM(CASE WHEN task.status = :cancelled THEN 1 ELSE 0 END)', 'cancelled')
      .where('task.createdAt BETWEEN :start AND :end', { start, end })
      .setParameter('done', TaskStatus.DONE)
      .setParameter('cancelled', TaskStatus.CANCELLED)
      .groupBy('assignee.id')
      .addGroupBy('assignee.fullName')
      .getRawMany();
  }
}
