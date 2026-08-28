import type { ActivityAction } from '../entities/task-activity.entity.js';
import type { TaskActivity } from '../entities/task-activity.entity.js';

export interface ActivityResponse {
  id: number;
  action: ActivityAction;
  taskId: number | null;
  taskTitle: string;
  taskDeleted: boolean;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  user: { id: number; fullName: string };
  createdAt: string;
}

/**
 * Never JOIN back to `tasks` — `taskTitle` is the snapshot column, so a
 * deleted task still renders correctly. See CONTEXT.md rule #1.
 */
export function toActivityResponse(activity: TaskActivity): ActivityResponse {
  return {
    id: activity.id,
    action: activity.action,
    taskId: activity.taskId,
    taskTitle: activity.taskTitle,
    taskDeleted: activity.taskId === null,
    fieldName: activity.fieldName,
    oldValue: activity.oldValue,
    newValue: activity.newValue,
    user: { id: activity.user.id, fullName: activity.user.fullName },
    createdAt: activity.createdAt.toISOString(),
  };
}
