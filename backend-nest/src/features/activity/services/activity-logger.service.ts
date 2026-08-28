import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskActivity } from '../entities/task-activity.entity.js';
import type { ActivityAction } from '../entities/task-activity.entity.js';

export interface LogActivityPayload {
  taskId: number | null;
  userId: number;
  action: ActivityAction;
  taskTitle: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class ActivityLoggerService {
  /**
   * Writes one `task_activities` row. MUST be called with the same
   * `EntityManager` as the surrounding `dataSource.transaction()` — never
   * fire-and-forget via EventEmitter — so a rollback never leaves a log
   * entry for something that didn't actually happen.
   */
  async log(manager: EntityManager, payload: LogActivityPayload): Promise<void> {
    const repo = manager.getRepository(TaskActivity);
    const entry = repo.create({
      taskId: payload.taskId,
      userId: payload.userId,
      action: payload.action,
      taskTitle: payload.taskTitle,
      fieldName: payload.fieldName ?? null,
      oldValue: payload.oldValue ?? null,
      newValue: payload.newValue ?? null,
      metadata: payload.metadata ?? null,
    });
    await repo.save(entry);
  }
}
