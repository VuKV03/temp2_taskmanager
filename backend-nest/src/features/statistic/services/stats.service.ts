import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DateTime } from 'luxon';
import { StatsRepository } from '../repositories/stats.repository.js';
import { convertDateRangeToUTC, getDayRange } from '../../../shared/utils/date-range.util.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import type { QueryStatsDto, QueryCompletionStatsDto } from '../dto/query-stats.dto.js';
import { TaskStatus, TaskPriority } from '../../task/types/task.types.js';
import type {
  StatsSummaryResponse,
  CompletionPoint,
  AdminStatsOverview,
  UserPerformance,
  StatusCount,
  PriorityCount,
} from '../types/statistic.types.js';

const CACHE_TTL_SECONDS = 60; // API_SPEC.md: "Response cache 60s theo user_id + range"

// Display order matches the API_SPEC.md worked example — not enum declaration order.
const STATUS_ORDER: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CANCELLED];
const PRIORITY_ORDER: TaskPriority[] = [
  TaskPriority.URGENT,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
];

interface Range {
  from: string;
  to: string;
  start: Date;
  end: Date;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly statsRepository: StatsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getSummary(user: JwtPayload, query: QueryStatsDto): Promise<StatsSummaryResponse> {
    const range = this.resolveRange(query, user.timezone);
    const cacheKey = `stats:summary:${user.id}:${range.from}:${range.to}`;
    const cached = await this.cache.get<StatsSummaryResponse>(cacheKey);
    if (cached) return cached;

    const todayStart = getDayRange(user.timezone).start;
    const [created, completed, cancelledCreated, overdue, inProgress, byStatusRaw, byPriorityRaw, byListRaw, avgHours, streakDays] =
      await Promise.all([
        this.statsRepository.countCreated(user.id, range.start, range.end),
        this.statsRepository.countCompleted(user.id, range.start, range.end),
        this.statsRepository.countCancelledCreated(user.id, range.start, range.end),
        this.statsRepository.countOverdue(user.id, todayStart),
        this.statsRepository.countInProgress(user.id),
        this.statsRepository.byStatus(user.id, range.start, range.end),
        this.statsRepository.byPriority(user.id, range.start, range.end),
        this.statsRepository.byList(user.id, range.start, range.end),
        this.statsRepository.avgCompletionHours(user.id, range.start, range.end),
        this.computeStreak(user.id, user.timezone),
      ]);

    const response: StatsSummaryResponse = {
      range: { from: range.from, to: range.to },
      totals: {
        created,
        completed,
        overdue,
        inProgress,
        completionRate: this.completionRate(completed, created, cancelledCreated),
      },
      byStatus: this.fillStatuses(byStatusRaw),
      byPriority: this.fillPriorities(byPriorityRaw),
      byList: byListRaw.map((r) => ({
        listId: Number(r.listId),
        name: r.name,
        total: Number(r.total),
        completed: Number(r.completed),
      })),
      streakDays,
      avgCompletionHours: avgHours ? Math.round(avgHours * 10) / 10 : 0,
    };

    await this.cache.set(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  async getCompletionTrend(user: JwtPayload, query: QueryCompletionStatsDto): Promise<CompletionPoint[]> {
    const range = this.resolveRange(query, user.timezone);
    const dates = await this.statsRepository.completedDates(user.id, range.start, range.end);
    return this.bucketDates(dates, query.groupBy ?? 'day', user.timezone);
  }

  async getByStatus(user: JwtPayload, query: QueryStatsDto): Promise<StatusCount[]> {
    const range = this.resolveRange(query, user.timezone);
    const raw = await this.statsRepository.byStatus(user.id, range.start, range.end);
    return this.fillStatuses(raw);
  }

  async getByPriority(user: JwtPayload, query: QueryStatsDto): Promise<PriorityCount[]> {
    const range = this.resolveRange(query, user.timezone);
    const raw = await this.statsRepository.byPriority(user.id, range.start, range.end);
    return this.fillPriorities(raw);
  }

  async getAdminOverview(query: QueryStatsDto): Promise<AdminStatsOverview> {
    // No single "current user" timezone system-wide — UTC is the neutral default for admin ranges.
    const range = this.resolveRange(query, 'UTC');
    const cacheKey = `stats:admin-overview:${range.from}:${range.to}`;
    const cached = await this.cache.get<AdminStatsOverview>(cacheKey);
    if (cached) return cached;

    const [created, completed, cancelledCreated, byStatusRaw, byPriorityRaw, totalUsers, overdue, inProgress] =
      await Promise.all([
        this.statsRepository.countCreated(null, range.start, range.end),
        this.statsRepository.countCompleted(null, range.start, range.end),
        this.statsRepository.countCancelledCreated(null, range.start, range.end),
        this.statsRepository.byStatus(null, range.start, range.end),
        this.statsRepository.byPriority(null, range.start, range.end),
        this.statsRepository.countUsers(),
        this.statsRepository.countOverdue(null, new Date()),
        this.statsRepository.countInProgress(null),
      ]);

    const response: AdminStatsOverview = {
      range: { from: range.from, to: range.to },
      totals: {
        created,
        completed,
        overdue,
        inProgress,
        completionRate: this.completionRate(completed, created, cancelledCreated),
        totalUsers,
      },
      byStatus: this.fillStatuses(byStatusRaw),
      byPriority: this.fillPriorities(byPriorityRaw),
    };

    await this.cache.set(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  async getByUserPerformance(query: QueryStatsDto): Promise<UserPerformance[]> {
    const range = this.resolveRange(query, 'UTC');
    const rows = await this.statsRepository.byUserPerformance(range.start, range.end);
    return rows
      .map((r) => {
        const created = Number(r.created);
        const completed = Number(r.completed);
        const cancelled = Number(r.cancelled);
        return {
          userId: Number(r.userId),
          fullName: r.fullName,
          created,
          completed,
          completionRate: this.completionRate(completed, created, cancelled),
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);
  }

  private completionRate(completed: number, created: number, cancelled: number): number {
    const denominator = created - cancelled;
    if (denominator <= 0) return 0;
    return Math.round((completed / denominator) * 100) / 100;
  }

  private resolveRange(query: QueryStatsDto, timezone: string): Range {
    const now = DateTime.now().setZone(timezone);
    const from = query.from ?? now.startOf('month').toISODate()!;
    const to = query.to ?? now.toISODate()!;
    const { start, end } = convertDateRangeToUTC(from, to, timezone);
    return { from, to, start, end };
  }

  private fillStatuses(raw: { status: string; count: string }[]): StatusCount[] {
    const map = new Map(raw.map((r) => [r.status, Number(r.count)]));
    return STATUS_ORDER.map((status) => ({ status, count: map.get(status) ?? 0 }));
  }

  private fillPriorities(raw: { priority: string; count: string }[]): PriorityCount[] {
    const map = new Map(raw.map((r) => [r.priority, Number(r.count)]));
    return PRIORITY_ORDER.map((priority) => ({ priority, count: map.get(priority) ?? 0 }));
  }

  private async computeStreak(userId: number, timezone: string): Promise<number> {
    const dates = await this.statsRepository.allCompletedDates(userId);
    const daySet = new Set(dates.map((d) => DateTime.fromJSDate(d).setZone(timezone).toISODate()));

    let streak = 0;
    let cursor = DateTime.now().setZone(timezone).startOf('day');
    while (daySet.has(cursor.toISODate())) {
      streak += 1;
      cursor = cursor.minus({ days: 1 });
    }
    return streak;
  }

  private bucketDates(dates: Date[], groupBy: 'day' | 'week' | 'month', timezone: string): CompletionPoint[] {
    const buckets = new Map<string, number>();
    for (const date of dates) {
      const dt = DateTime.fromJSDate(date).setZone(timezone);
      const key =
        groupBy === 'day'
          ? dt.toISODate()!
          : groupBy === 'week'
            ? dt.startOf('week').toISODate()!
            : dt.startOf('month').toISODate()!;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, completed]) => ({ date, completed }));
  }
}
