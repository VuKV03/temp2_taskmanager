import { Badge } from '../../../shared/components/ui';
import { TASK_STATUS_LABEL } from '../types/task.types';
import type { TaskStatus } from '../types/task.types';

const STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  todo: { bg: 'var(--color-status-todo)', text: 'var(--color-status-todo-text)' },
  in_progress: { bg: 'var(--color-status-in-progress)', text: 'var(--color-status-in-progress-text)' },
  done: { bg: 'var(--color-status-done)', text: 'var(--color-status-done-text)' },
  cancelled: { bg: 'var(--color-status-cancelled)', text: 'var(--color-status-cancelled-text)' },
};

export const StatusBadge = ({ status }: { status: TaskStatus }) => (
  <Badge style={{ backgroundColor: STYLES[status].bg, color: STYLES[status].text }}>
    {TASK_STATUS_LABEL[status]}
  </Badge>
);
