import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { getDayRange, formatDateInTimezone } from '../../../shared/utils/date-range.util.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { Task } from '../entities/task.entity.js';
import { toTaskResponse } from '../types/task.types.js';
import type { TaskResponse } from '../types/task.types.js';

export interface TodayViewResponse {
  date: string;
  timezone: string;
  overdue: TaskResponse[];
  today: TaskResponse[];
  counters: { overdue: number; today: number; completedToday: number };
}

@Injectable()
export class TaskViewService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async getToday(user: JwtPayload, timezoneOverride: string | undefined): Promise<TodayViewResponse> {
    const timezone = timezoneOverride || user.timezone;
    const { start, end } = getDayRange(timezone);

    const [overdueTasks, todayTasks, completedToday] = await Promise.all([
      this.taskRepository.findOverdueTasks(user.id, start),
      this.taskRepository.findTodayTasks(user.id, start, end),
      this.taskRepository.countCompletedInRange(user.id, start, end),
    ]);

    const overdue = await this.attachSubtaskCounts(overdueTasks);
    const today = await this.attachSubtaskCounts(todayTasks);

    return {
      date: formatDateInTimezone(new Date(), timezone),
      timezone,
      overdue,
      today,
      counters: { overdue: overdue.length, today: today.length, completedToday },
    };
  }

  async getOverdue(user: JwtPayload, timezoneOverride: string | undefined): Promise<TaskResponse[]> {
    const timezone = timezoneOverride || user.timezone;
    const { start } = getDayRange(timezone);
    const tasks = await this.taskRepository.findOverdueTasks(user.id, start);
    return this.attachSubtaskCounts(tasks);
  }

  async getUpcoming(user: JwtPayload, timezoneOverride: string | undefined): Promise<TaskResponse[]> {
    const timezone = timezoneOverride || user.timezone;
    const start = DateTime.now().setZone(timezone).plus({ days: 1 }).startOf('day').toUTC().toJSDate();
    const end = DateTime.now().setZone(timezone).plus({ days: 8 }).startOf('day').toUTC().toJSDate();
    const tasks = await this.taskRepository.findUpcomingTasks(user.id, start, end);
    return this.attachSubtaskCounts(tasks);
  }

  private async attachSubtaskCounts(tasks: Task[]): Promise<TaskResponse[]> {
    const counts = await this.taskRepository.getSubtaskCounts(tasks.map((t) => t.id));
    return tasks.map((task) => toTaskResponse(task, counts.get(Number(task.id))));
  }
}
