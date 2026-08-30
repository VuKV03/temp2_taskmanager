import { useState } from 'react';
import { CalendarPlus, Plus, Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { Drawer, Input, Select, FilterDropdown } from '../../../shared/components/ui';
import { Skeleton, EmptyState, ErrorState } from '../../../shared/components/feedback';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useLists } from '../../../features/task-list';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from '../types/task.types';
import type { TaskStatus, TaskPriority } from '../types/task.types';

const STATUS_OPTIONS = (Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABEL[value],
}));
const PRIORITY_OPTIONS = (Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}));

interface AddTodayTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Ids already in today's overdue/today lists — hidden here, nothing to schedule. */
  existingIds: number[];
  /** Nothing matches what the user wants — bail out to the real create-task form. */
  onCreateNew: () => void;
}

export const AddTodayTaskDrawer = ({ open, onClose, existingIds, onCreateNew }: AddTodayTaskDrawerProps) => {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string[]>([]);
  const [listId, setListId] = useState('');

  const { data: lists } = useLists();
  const { data, isLoading, isError, refetch } = useTasks({
    q: debouncedQ || undefined,
    status: status.length ? (status as TaskStatus[]) : undefined,
    priority: priority.length ? (priority as TaskPriority[]) : undefined,
    listId: listId ? Number(listId) : undefined,
    limit: 50,
  });
  const { mutate: updateTask, isPending, variables } = useUpdateTask();

  // Already due today/overdue — pulling it in here again would be a no-op.
  const tasks = (data?.data ?? []).filter((t) => !existingIds.includes(t.id));

  const addToToday = (taskId: number) => {
    // Not `.endOf('day')` (23:59:59.999) — the `due_date` column is a plain
    // `DATETIME` with no fractional-second precision, so MySQL rounds .999ms
    // up to the next whole second, which flips it to 00:00:00 tomorrow and
    // the task silently lands one day off instead of showing up today.
    const dueDate = DateTime.now().set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).toUTC().toISO()!;
    updateTask({ id: taskId, payload: { dueDate } });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Thêm việc vào hôm nay">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm công việc..."
              className="pl-9"
              aria-label="Tìm công việc"
            />
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="flex shrink-0 items-center gap-1 rounded-md border border-dashed border-border px-3 py-2 text-small text-text-muted hover:text-text"
          >
            <Plus className="h-3.5 w-3.5" />
            Tạo mới
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterDropdown label="Trạng thái" options={STATUS_OPTIONS} selected={status} onChange={setStatus} />
          <FilterDropdown label="Độ ưu tiên" options={PRIORITY_OPTIONS} selected={priority} onChange={setPriority} />
          {lists && lists.length > 0 && (
            <Select value={listId} onChange={(e) => setListId(e.target.value)} className="h-9 w-36 py-0 text-small">
              <option value="">Tất cả danh sách</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {isError && <ErrorState description="Không tải được công việc." onRetry={() => refetch()} />}

        {data && tasks.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Không tìm thấy công việc phù hợp"
            description="Thử điều chỉnh bộ lọc, hoặc tạo một việc mới."
            action={{ label: 'Tạo việc mới', onClick: onCreateNew }}
          />
        )}

        {tasks.length > 0 && (
          <div className="overflow-hidden rounded-md border border-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 border-b border-border bg-surface px-3 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-text">{task.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-small text-text-muted">
                    {task.list && <span>{task.list.name}</span>}
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPending && variables?.id === task.id}
                  onClick={() => addToToday(task.id)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-primary px-2.5 py-1.5 text-small text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Hôm nay
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
