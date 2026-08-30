import { Checkbox } from '../../../shared/components/ui';
import { getDueLabel } from '../../../shared/lib/datetime';
import { cn } from '../../../shared/utils/cn';
import { PriorityBadge } from './PriorityBadge';
import type { Task } from '../types/task.types';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';

interface TaskItemProps {
  task: Task;
  onOpenDetail: (id: number) => void;
  /** Show the red left border + treat as overdue styling (Today page). */
  isOverdue?: boolean;
}

export const TaskItem = ({ task, onOpenDetail, isOverdue }: TaskItemProps) => {
  const { mutate: updateStatus, isPending } = useUpdateTaskStatus();
  const isDone = task.status === 'done';

  const toggle = () => {
    updateStatus({ id: task.id, status: isDone ? 'todo' : 'done' });
  };

  const metaParts: string[] = [];
  if (task.list) metaParts.push(task.list.name);
  if (task.dueDate) metaParts.push(getDueLabel(task.dueDate));
  if (task.subtaskCount) metaParts.push(`${task.completedSubtaskCount ?? 0}/${task.subtaskCount} việc con`);

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border bg-surface px-3 py-3 last:border-b-0',
        isOverdue && 'border-l-[3px] border-l-red-500',
      )}
    >
      <Checkbox
        checked={isDone}
        disabled={isPending}
        onChange={toggle}
        aria-label={`Đánh dấu hoàn thành: ${task.title}`}
      />

      <button onClick={() => onOpenDetail(task.id)} className="min-w-0 flex-1 text-left">
        <p className={cn('truncate text-body text-text', isDone && 'text-text-muted line-through')}>
          {task.title}
        </p>
        {(metaParts.length > 0 || task.tags.length > 0) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-muted">
            {metaParts.length > 0 && <span>{metaParts.join(' · ')}</span>}
            {task.tags.map((tag) => (
              <span key={tag.id} className="text-primary">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </button>

      <PriorityBadge priority={task.priority} />
    </div>
  );
};
