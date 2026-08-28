import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Checkbox, Input } from '../../../shared/components/ui';
import { cn } from '../../../shared/utils/cn';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { useCreateTask } from '../hooks/useCreateTask';
import type { SubtaskItem } from '../types/task.types';

interface SubtaskListProps {
  parentTaskId: number;
  subtasks: SubtaskItem[];
}

export const SubtaskList = ({ parentTaskId, subtasks }: SubtaskListProps) => {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const [title, setTitle] = useState('');

  const completed = subtasks.filter((s) => s.status === 'done' || s.status === 'cancelled').length;

  const addSubtask = () => {
    if (!title.trim()) return;
    createTask({ title: title.trim(), parentTaskId }, { onSuccess: () => setTitle('') });
  };

  return (
    <div>
      <h3 className="mb-2 text-small font-semibold uppercase tracking-wide text-text-muted">
        Việc con ({completed}/{subtasks.length})
      </h3>

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <label key={subtask.id} className="flex items-center gap-2 py-1">
            <Checkbox
              checked={subtask.status === 'done'}
              onChange={() =>
                updateStatus({ id: subtask.id, status: subtask.status === 'done' ? 'todo' : 'done' })
              }
              aria-label={`Đánh dấu hoàn thành: ${subtask.title}`}
            />
            <span className={cn('text-body text-text', subtask.status === 'done' && 'text-text-muted line-through')}>
              {subtask.title}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Plus className="h-4 w-4 shrink-0 text-text-muted" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSubtask();
            }
          }}
          placeholder="Thêm việc con"
          disabled={isCreating}
          className="h-8 border-none px-0 shadow-none focus:ring-0"
        />
      </div>
    </div>
  );
};
