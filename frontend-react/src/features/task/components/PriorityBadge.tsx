import { TASK_PRIORITY_LABEL } from '../types/task.types';
import type { TaskPriority } from '../types/task.types';

const COLOR_VAR: Record<TaskPriority, string> = {
  urgent: 'var(--color-priority-urgent)',
  high: 'var(--color-priority-high)',
  medium: 'var(--color-priority-medium)',
  low: 'var(--color-priority-low)',
};

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span className="inline-flex items-center gap-1.5 text-small font-medium" style={{ color: COLOR_VAR[priority] }}>
    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLOR_VAR[priority] }} />
    {TASK_PRIORITY_LABEL[priority]}
  </span>
);
