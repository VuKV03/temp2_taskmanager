import { Play, Pencil, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Checkbox } from '../../../shared/components/ui';
import { formatDate } from '../../../shared/lib/datetime';
import { cn } from '../../../shared/utils/cn';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import type { Task } from '../types/task.types';

interface TaskTableProps {
  tasks: Task[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onOpenDetail: (id: number) => void;
  onStart: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Red left border per row — Today page's "Quá hạn" section. */
  isOverdue?: boolean;
  /**
   * `TaskListPage`'s "Xoá" archives the task outright. `TodayPage`'s delete
   * action means something else entirely (unschedule from today, task stays
   * intact) — the label/icon must say so, or it reads as data loss.
   */
  deleteLabel?: string;
  deleteIcon?: LucideIcon;
  /** false = hover stays neutral/primary instead of red — nothing is actually being destroyed. */
  deleteIsDangerous?: boolean;
}

export const TaskTable = ({
  tasks,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  onStart,
  onEdit,
  onDelete,
  isOverdue,
  deleteLabel = 'Xoá',
  deleteIcon: DeleteIcon = Trash2,
  deleteIsDangerous = true,
}: TaskTableProps) => {
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-body">
        <thead className="border-b border-border bg-background text-small text-text-muted">
          <tr>
            <th className="w-10 px-3 py-2">
              <Checkbox checked={allSelected} onChange={onToggleSelectAll} aria-label="Chọn tất cả" />
            </th>
            <th className="px-3 py-2 font-medium">Tiêu đề</th>
            <th className="px-3 py-2 font-medium">Danh sách</th>
            <th className="px-3 py-2 font-medium">Trạng thái</th>
            <th className="px-3 py-2 font-medium">Ưu tiên</th>
            <th className="px-3 py-2 font-medium">Hạn chót</th>
            <th className="px-3 py-2 font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr key={task.id} className={cn(selectedIds.has(task.id) && 'bg-primary/5')}>
              <td className={cn('px-3 py-2', isOverdue && 'border-l-[3px] border-l-red-500')}>
                <Checkbox
                  checked={selectedIds.has(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  aria-label={`Chọn ${task.title}`}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onOpenDetail(task.id)}
                  className="max-w-xs truncate text-left text-text hover:text-primary hover:underline"
                >
                  {task.title}
                </button>
              </td>
              <td className="px-3 py-2 text-text-muted">{task.list?.name ?? '—'}</td>
              <td className="px-3 py-2">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-3 py-2">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-3 py-2 text-text-muted">{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={task.status === 'done' || task.status === 'cancelled'}
                    onClick={() => onStart(task)}
                    title="Bắt đầu làm"
                    aria-label={`Bắt đầu làm ${task.title}`}
                    className="rounded p-1.5 text-text-muted hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    title="Chỉnh sửa"
                    aria-label={`Chỉnh sửa ${task.title}`}
                    className="rounded p-1.5 text-text-muted hover:bg-background hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(task)}
                    title={deleteLabel}
                    aria-label={`${deleteLabel}: ${task.title}`}
                    className={cn(
                      'rounded p-1.5 text-text-muted hover:bg-background',
                      deleteIsDangerous ? 'hover:text-red-600' : 'hover:text-primary',
                    )}
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
