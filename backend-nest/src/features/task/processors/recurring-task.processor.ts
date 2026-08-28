import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { TaskRecurrenceService } from '../services/task-recurrence.service.js';

export const RECURRING_TASKS_QUEUE = 'recurring-tasks';
const JOB_NAME = 'generate-occurrences';
const SCHEDULER_ID = 'daily-recurring-generation';

/**
 * BullMQ processor for recurring-task generation — task/CONTEXT.md:
 * "Recurring task generation (`recurrence_rule` cron at 00:05)". Registers
 * its own repeatable job on boot via `upsertJobScheduler`, which is
 * idempotent (keyed by `SCHEDULER_ID`) — safe to run on every app start,
 * won't pile up duplicate schedules.
 */
@Injectable()
@Processor(RECURRING_TASKS_QUEUE)
export class RecurringTaskProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(RecurringTaskProcessor.name);

  constructor(
    @InjectQueue(RECURRING_TASKS_QUEUE) private readonly queue: Queue,
    private readonly taskRecurrenceService: TaskRecurrenceService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.queue.upsertJobScheduler(SCHEDULER_ID, { pattern: '5 0 * * *' }, { name: JOB_NAME });
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Running recurring-task generation (job ${job.id})`);
    const created = await this.taskRecurrenceService.generateDueOccurrences();
    this.logger.log(`Recurring-task generation done: ${created} new occurrence(s)`);
  }
}
