import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Task } from '../entities/task.entity.js';
import { TaskStatus } from '../types/task.types.js';
import type { QueryTaskDto } from '../dto/query-task.dto.js';

const DONE_STATUSES = [TaskStatus.DONE, TaskStatus.CANCELLED];

export interface SubtaskCount {
  total: number;
  completed: number;
}

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private baseQuery(): SelectQueryBuilder<Task> {
    return this.repo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.list', 'list')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.tags', 'tags');
  }

  findById(id: number): Promise<Task | null> {
    return this.baseQuery().where('task.id = :id', { id }).getOne();
  }

  /** Lightweight lookup for ownership/state-machine checks — no joins. */
  findByIdBare(id: number): Promise<Task | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Task>): Task {
    return this.repo.create(data);
  }

  save(task: Task): Promise<Task> {
    return this.repo.save(task);
  }

  saveMany(tasks: Task[]): Promise<Task[]> {
    return this.repo.save(tasks);
  }

  async hardDelete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }

  findSubtasks(parentTaskId: number): Promise<Task[]> {
    return this.baseQuery()
      .where('task.parentTaskId = :parentTaskId', { parentTaskId })
      .andWhere('task.isArchived = false')
      .getMany();
  }

  /** Grouped total/completed subtask counts, keyed by parent task id. */
  async getSubtaskCounts(parentIds: number[]): Promise<Map<number, SubtaskCount>> {
    const result = new Map<number, SubtaskCount>();
    if (parentIds.length === 0) return result;

    const rows = await this.repo
      .createQueryBuilder('task')
      .select('task.parent_task_id', 'parentId')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN task.status IN (:...done) THEN 1 ELSE 0 END)', 'completed')
      .where('task.parent_task_id IN (:...parentIds)', { parentIds })
      .andWhere('task.is_archived = false')
      .setParameter('done', DONE_STATUSES)
      .groupBy('task.parent_task_id')
      .getRawMany<{ parentId: string; total: string; completed: string }>();

    for (const row of rows) {
      result.set(Number(row.parentId), { total: Number(row.total), completed: Number(row.completed) });
    }
    return result;
  }

  async findMany(userId: number, query: QueryTaskDto): Promise<{ items: Task[]; total: number }> {
    const qb = this.baseQuery().where('(task.creatorId = :userId OR task.assigneeId = :userId)', { userId });

    if (!query.includeArchived) {
      qb.andWhere('task.isArchived = false');
    }
    this.applyFilters(qb, query);

    const sortColumn = this.resolveSortColumn(query.sort);
    qb.orderBy(sortColumn, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async adminFindMany(query: QueryTaskDto): Promise<{ items: Task[]; total: number }> {
    const qb = this.baseQuery();
    if (!query.includeArchived) {
      qb.andWhere('task.isArchived = false');
    }
    this.applyFilters(qb, query);

    const sortColumn = this.resolveSortColumn(query.sort);
    qb.orderBy(sortColumn, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  private resolveSortColumn(sort: string | undefined): string {
    const sortColumnMap: Record<string, string> = {
      dueDate: 'task.dueDate',
      priority: 'task.priority',
      createdAt: 'task.createdAt',
      updatedAt: 'task.updatedAt',
      sortOrder: 'task.sortOrder',
    };
    return sortColumnMap[sort ?? 'sortOrder'] ?? 'task.sortOrder';
  }

  private applyFilters(qb: SelectQueryBuilder<Task>, query: QueryTaskDto): void {
    if (query.status?.length) {
      qb.andWhere('task.status IN (:...status)', { status: query.status });
    }
    if (query.priority?.length) {
      qb.andWhere('task.priority IN (:...priority)', { priority: query.priority });
    }
    if (query.listId !== undefined) {
      qb.andWhere('task.listId = :listId', { listId: query.listId });
    }
    if (query.assigneeId !== undefined) {
      qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: query.assigneeId });
    }
    if (query.tagIds?.length) {
      qb.andWhere('tags.id IN (:...tagIds)', { tagIds: query.tagIds });
    }
    if (query.dueFrom) {
      qb.andWhere('task.dueDate >= :dueFrom', { dueFrom: new Date(`${query.dueFrom}T00:00:00.000Z`) });
    }
    if (query.dueTo) {
      qb.andWhere('task.dueDate <= :dueTo', { dueTo: new Date(`${query.dueTo}T23:59:59.999Z`) });
    }
    if (query.q) {
      qb.andWhere('(task.title LIKE :q OR task.description LIKE :q)', { q: `%${query.q}%` });
    }
  }

  /** "Hôm nay": due within the given UTC day range, not done/cancelled. */
  findTodayTasks(assigneeId: number, start: Date, end: Date): Promise<Task[]> {
    return this.baseQuery()
      .where('task.assigneeId = :assigneeId', { assigneeId })
      .andWhere('task.dueDate >= :start AND task.dueDate < :end', { start, end })
      .andWhere('task.status NOT IN (:...done)', { done: DONE_STATUSES })
      .andWhere('task.isArchived = false')
      .orderBy('task.dueDate', 'ASC')
      .limit(200)
      .getMany();
  }

  /** "Quá hạn": due before the start of "today", not done/cancelled. */
  findOverdueTasks(assigneeId: number, start: Date): Promise<Task[]> {
    return this.baseQuery()
      .where('task.assigneeId = :assigneeId', { assigneeId })
      .andWhere('task.dueDate < :start', { start })
      .andWhere('task.status NOT IN (:...done)', { done: DONE_STATUSES })
      .andWhere('task.isArchived = false')
      .orderBy('task.dueDate', 'ASC')
      .limit(200)
      .getMany();
  }

  countCompletedInRange(assigneeId: number, start: Date, end: Date): Promise<number> {
    return this.repo
      .createQueryBuilder('task')
      .where('task.assigneeId = :assigneeId', { assigneeId })
      .andWhere('task.completedAt >= :start AND task.completedAt < :end', { start, end })
      .getCount();
  }

  /** "Trong 7 ngày tới": due within [start, end), not done/cancelled. */
  findUpcomingTasks(assigneeId: number, start: Date, end: Date): Promise<Task[]> {
    return this.baseQuery()
      .where('task.assigneeId = :assigneeId', { assigneeId })
      .andWhere('task.dueDate >= :start AND task.dueDate < :end', { start, end })
      .andWhere('task.status NOT IN (:...done)', { done: DONE_STATUSES })
      .andWhere('task.isArchived = false')
      .orderBy('task.dueDate', 'ASC')
      .limit(200)
      .getMany();
  }

  findByIds(ids: number[]): Promise<Task[]> {
    return this.repo.find({ where: { id: In(ids) } });
  }

  /** Same as `findByIds` but with the response relations (list/creator/assignee/tags) joined. */
  findByIdsWithRelations(ids: number[]): Promise<Task[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.baseQuery().where('task.id IN (:...ids)', { ids }).getMany();
  }

  /**
   * Used by `RecurringTaskProcessor`: every task still "holding the torch"
   * for its series (see task/CONTEXT.md Recurring Tasks) — `recurrenceRule`
   * set, not archived, due date already in the past. Needs `dueDate` to
   * compute the next occurrence and `assignee` for its timezone.
   */
  findActiveRecurringTemplates(now: Date): Promise<Task[]> {
    return this.repo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.tags', 'tags')
      .where('task.recurrenceRule IS NOT NULL')
      .andWhere('task.isArchived = false')
      .andWhere('task.dueDate IS NOT NULL')
      .andWhere('task.dueDate <= :now', { now })
      .getMany();
  }

  /**
   * Used by `notification`'s cron job: every non-done/cancelled, non-archived,
   * assigned task due within the next 48h OR already overdue. A generous UTC
   * prefetch window — the cron job itself re-checks each task against its
   * assignee's timezone (`due_soon` = due by end of tomorrow, `overdue` =
   * due before start of today, both in the assignee's zone) since a single
   * SQL predicate can't express "per-row timezone".
   */
  findNotificationCandidates(nowUtc: Date, lookaheadHours: number): Promise<Task[]> {
    const horizon = new Date(nowUtc.getTime() + lookaheadHours * 60 * 60 * 1000);
    return this.repo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.assigneeId IS NOT NULL')
      .andWhere('task.dueDate IS NOT NULL')
      .andWhere('task.dueDate <= :horizon', { horizon })
      .andWhere('task.status NOT IN (:...done)', { done: DONE_STATUSES })
      .andWhere('task.isArchived = false')
      .getMany();
  }
}
