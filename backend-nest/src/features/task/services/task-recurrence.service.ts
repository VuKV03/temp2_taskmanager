import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { parseRecurrenceRule, computeNextOccurrence } from '../../../shared/utils/recurrence.util.js';
import { ActivityLoggerService } from '../../activity/services/activity-logger.service.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { Task } from '../entities/task.entity.js';
import { TaskStatus } from '../types/task.types.js';

/**
 * Generates the next occurrence of a recurring task (business rule #16:
 * "job sinh bản ghi mới, không dời due_date của bản cũ" — spawns a NEW row,
 * never moves the old row's `due_date`).
 *
 * Design: `recurrence_rule` acts as a "torch" held by exactly one row in a
 * series at a time. When that row's `due_date` has passed, this service
 * clones it into a new row (due date = next occurrence, same
 * `recurrence_rule`) and clears the rule on the old row — the torch passes
 * forward. This means at most one new row is spawned per run per series,
 * and a missed cron window naturally catches up one step at a time on
 * subsequent runs instead of ever double-booking a date.
 */
@Injectable()
export class TaskRecurrenceService {
  private readonly logger = new Logger(TaskRecurrenceService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly taskRepository: TaskRepository,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  /** Entry point for `RecurringTaskProcessor`. Returns how many new occurrences were created. */
  async generateDueOccurrences(): Promise<number> {
    const templates = await this.taskRepository.findActiveRecurringTemplates(new Date());
    let created = 0;

    for (const template of templates) {
      try {
        const spawned = await this.spawnNextOccurrence(template);
        if (spawned) created += 1;
      } catch (err) {
        // One bad row (unparseable rule, race with a manual edit) must not
        // stop the rest of the batch.
        this.logger.warn(`Failed to generate recurrence for task ${template.id}: ${(err as Error).message}`);
      }
    }

    if (created > 0) this.logger.log(`Generated ${created} recurring task occurrence(s)`);
    return created;
  }

  private async spawnNextOccurrence(template: Task): Promise<boolean> {
    const rule = parseRecurrenceRule(template.recurrenceRule!);
    if (!rule) {
      this.logger.warn(`Task ${template.id} has an unparseable recurrenceRule, skipping: ${template.recurrenceRule}`);
      return false;
    }

    const timezone = template.assignee?.timezone || 'Asia/Ho_Chi_Minh';
    const nextDueDate = computeNextOccurrence(rule, template.dueDate!, timezone);
    // Preserve the original start_date -> due_date gap, if there was one.
    const nextStartDate = template.startDate
      ? new Date(nextDueDate.getTime() - (template.dueDate!.getTime() - template.startDate.getTime()))
      : null;

    await this.dataSource.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);

      const nextTask = taskRepo.create({
        listId: template.listId,
        parentTaskId: null,
        creatorId: template.creatorId,
        assigneeId: template.assigneeId,
        title: template.title,
        description: template.description,
        status: TaskStatus.TODO,
        priority: template.priority,
        startDate: nextStartDate,
        dueDate: nextDueDate,
        completedAt: null,
        estimateMinutes: template.estimateMinutes,
        recurrenceRule: template.recurrenceRule, // torch passes to the new row
        sortOrder: template.sortOrder,
        tags: template.tags,
      });
      const savedTask = await taskRepo.save(nextTask);

      // Hand off: the template no longer generates future occurrences.
      template.recurrenceRule = null;
      await taskRepo.save(template);

      await this.activityLogger.log(manager, {
        taskId: savedTask.id,
        userId: template.creatorId,
        action: 'created',
        taskTitle: savedTask.title,
        metadata: { recurringFromTaskId: template.id },
      });
    });

    return true;
  }
}
