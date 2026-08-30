import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DateTime } from 'luxon';
import { Plus, CalendarX } from 'lucide-react';
import { Button, ConfirmDialog } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { useBulkRemoveFromToday } from '../hooks/useBulkRemoveFromToday';
import { useStartTask } from '../hooks/useStartTask';
import { TaskTable } from '../components/TaskTable';
import { TaskFormModal } from '../components/TaskFormModal';
import { AddTodayTaskDrawer } from '../components/AddTodayTaskDrawer';
import { ROUTES } from '../../../routes/routes';
import type { Task } from '../types/task.types';

const StatCard = ({ value, label }: { value: number; label: string }) => (
  <div className="flex-1 rounded-md border border-border bg-surface p-4 text-center">
    <p className="text-stat font-bold text-text">{value}</p>
    <p className="text-small text-text-muted">{label}</p>
  </div>
);

export const TodayPage = () => {
  const { data, isLoading, isError, refetch } = useTodayTasks();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Task | undefined>();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  // Shared across both "Quá hạn" and "Hôm nay" tables — a task can only be in
  // one of the two, so ids never collide.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Deleting from "Hôm nay" never archives — it just clears `dueDate`, so the
  // task stays fully intact in "Danh sách công việc". Same rule for bulk.
  const { mutate: updateTask, isPending: isRemoving } = useUpdateTask();
  const { mutate: bulkRemoveFromToday, isPending: isBulkRemoving } = useBulkRemoveFromToday();
  const { startTask } = useStartTask();

  const openDetail = (id: number) => navigate(ROUTES.TASK_DETAIL.replace(':id', String(id)));

  const today = DateTime.now().setLocale('vi').toFormat('cccc, dd/MM/yyyy');
  // Prefills "Hạn chót" when the user bails from the picker into a real create
  // form — otherwise a task created from "Hôm nay" might not even show up there.
  const defaultDueDate = DateTime.now().endOf('day').toFormat("yyyy-MM-dd'T'HH:mm");
  const existingIds = data ? [...data.overdue, ...data.today].map((t) => t.id) : [];

  // Selection only makes sense for the list it was made on — clear it whenever
  // the underlying today/overdue data is refetched with different rows.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [data?.overdue.length, data?.today.length]);

  const openCreateForm = () => {
    setPickerOpen(false);
    setFormOpen(true);
  };

  const toggleSelect = (taskId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleSelectAllIn = (tasks: Task[]) => () => {
    setSelectedIds((prev) => {
      const allSelected = tasks.every((t) => prev.has(t.id));
      const next = new Set(prev);
      for (const t of tasks) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  };

  const confirmBulkRemove = () => {
    // `t.id` can come back as a numeric string (bigint) — normalize before sending.
    bulkRemoveFromToday(Array.from(selectedIds).map(Number), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Hôm nay</h1>
        <p className="text-body capitalize text-text-muted">{today}</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được công việc hôm nay." onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="flex gap-3">
            <StatCard value={data.counters.today} label="Hôm nay" />
            <StatCard value={data.counters.completedToday} label="Đã xong" />
            <StatCard value={data.counters.overdue} label="Quá hạn" />
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-md border border-primary bg-primary/5 px-3 py-2">
              <span className="text-small text-text">Đã chọn {selectedIds.size} công việc</span>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-primary px-3 py-1.5 text-small text-primary hover:bg-primary/10"
              >
                <CalendarX className="h-3.5 w-3.5" />
                Bỏ khỏi hôm nay
              </button>
            </div>
          )}

          {data.overdue.length > 0 && (
            <div>
              <h2 className="mb-2 text-red-600">⚠ Quá hạn ({data.overdue.length})</h2>
              <TaskTable
                tasks={data.overdue}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAllIn(data.overdue)}
                onOpenDetail={openDetail}
                onStart={startTask}
                onEdit={setEditingTask}
                onDelete={setDeleteTarget}
                isOverdue
                deleteLabel="Bỏ khỏi hôm nay"
                deleteIcon={CalendarX}
                deleteIsDangerous={false}
              />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2>Hôm nay ({data.today.length})</h2>
              <Button size="sm" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" />
                Thêm việc
              </Button>
            </div>

            {data.today.length === 0 && data.overdue.length === 0 ? (
              <EmptyState
                icon="☀️"
                title="Hôm nay không có việc nào"
                description="Nghỉ ngơi thôi, hoặc thêm một việc mới!"
                action={{ label: 'Thêm việc', onClick: () => setPickerOpen(true) }}
              />
            ) : data.today.length === 0 ? (
              <p className="text-body text-text-muted">Không có việc nào khác cho hôm nay.</p>
            ) : (
              <TaskTable
                tasks={data.today}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAllIn(data.today)}
                onOpenDetail={openDetail}
                onStart={startTask}
                onEdit={setEditingTask}
                onDelete={setDeleteTarget}
                deleteLabel="Bỏ khỏi hôm nay"
                deleteIcon={CalendarX}
                deleteIsDangerous={false}
              />
            )}
          </div>
        </>
      )}

      <AddTodayTaskDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existingIds={existingIds}
        onCreateNew={openCreateForm}
      />

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} defaultDueDate={defaultDueDate} />

      <TaskFormModal open={!!editingTask} onClose={() => setEditingTask(undefined)} task={editingTask} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={() =>
          deleteTarget &&
          updateTask(
            { id: deleteTarget.id, payload: { dueDate: null } },
            { onSuccess: () => setDeleteTarget(undefined) },
          )
        }
        title="Bỏ khỏi Hôm nay?"
        description={`"${deleteTarget?.title}" sẽ không còn hạn hôm nay và biến mất khỏi trang này — công việc vẫn còn nguyên trong "Danh sách công việc".`}
        confirmLabel="Bỏ khỏi hôm nay"
        isDangerous={false}
        isLoading={isRemoving}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkRemove}
        title="Bỏ các công việc đã chọn khỏi Hôm nay?"
        description={`${selectedIds.size} công việc sẽ không còn hạn hôm nay và biến mất khỏi trang này — vẫn còn nguyên trong "Danh sách công việc".`}
        confirmLabel="Bỏ khỏi hôm nay"
        isDangerous={false}
        isLoading={isBulkRemoving}
      />
    </div>
  );
};
