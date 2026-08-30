import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button, Select, ConfirmDialog } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { useList } from '../../../features/task-list';
import { useTasks } from '../hooks/useTasks';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useBulkDeleteTasks } from '../hooks/useBulkDeleteTasks';
import { useStartTask } from '../hooks/useStartTask';
import { TaskTable } from '../components/TaskTable';
import { TaskFilters } from '../components/TaskFilters';
import { TaskFormModal } from '../components/TaskFormModal';
import { ROUTES } from '../../../routes/routes';
import type { Task, TaskParams, TaskStatus, TaskPriority } from '../types/task.types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const TaskListPage = () => {
  const { id } = useParams<{ id: string }>();
  const listId = id ? Number(id) : undefined;
  const { data: list } = useList(listId);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Task | undefined>();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: bulkDeleteTasks, isPending: isBulkDeleting } = useBulkDeleteTasks();
  const { startTask } = useStartTask();

  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '20');
  const status = searchParams.get('status')?.split(',').filter(Boolean) as TaskStatus[] | undefined;
  const priority = searchParams.get('priority')?.split(',').filter(Boolean) as TaskPriority[] | undefined;
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean).map(Number);
  const q = searchParams.get('q') || undefined;

  const params: TaskParams = { page, limit, status, priority, tagIds, q, listId };
  const { data, isLoading, isError, refetch } = useTasks(params);

  // A row selection only makes sense for the page/filters it was made on.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, status?.join(','), priority?.join(','), tagIds?.join(','), q, listId]);

  const openDetail = (taskId: number) => navigate(ROUTES.TASK_DETAIL.replace(':id', String(taskId)));

  const hasActiveFilters = !!(status?.length || priority?.length || tagIds?.length || q);

  const setPage = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
  };

  const setLimit = (nextLimit: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('limit', String(nextLimit));
      next.delete('page');
      return next;
    });
  };

  const toggleSelect = (taskId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    setSelectedIds((prev) => {
      const allSelected = data.data.every((t) => prev.has(t.id));
      return allSelected ? new Set() : new Set(data.data.map((t) => t.id));
    });
  };

  const confirmBulkDelete = () => {
    // `t.id` can come back as a numeric string (bigint) — normalize before sending.
    bulkDeleteTasks(Array.from(selectedIds).map(Number), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      },
    });
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>{list ? list.name : 'Công việc'}</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm việc
        </Button>
      </div>

      <TaskFilters />

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-primary bg-primary/5 px-3 py-2">
          <span className="text-small text-text">Đã chọn {selectedIds.size} công việc</span>
          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-red-600 px-3 py-1.5 text-small text-red-600 hover:bg-red-600/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xoá đã chọn
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được công việc." onRetry={() => refetch()} />}

      {data && data.data.length === 0 && hasActiveFilters && (
        <EmptyState
          icon="🔍"
          title="Không có việc nào khớp bộ lọc"
          description="Thử điều chỉnh hoặc xoá bớt bộ lọc."
          action={{ label: 'Xoá lọc', onClick: () => setSearchParams({}) }}
        />
      )}

      {data && data.data.length === 0 && !hasActiveFilters && (
        <EmptyState
          icon="📋"
          title="Chưa có công việc nào"
          description="Tạo công việc đầu tiên của bạn."
          action={{ label: 'Thêm việc', onClick: () => setFormOpen(true) }}
        />
      )}

      {data && data.data.length > 0 && (
        <>
          <TaskTable
            tasks={data.data}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onOpenDetail={openDetail}
            onStart={startTask}
            onEdit={setEditingTask}
            onDelete={setDeleteTarget}
          />

          <div className="flex items-center justify-between text-small text-text-muted">
            <div className="flex items-center gap-2">
              <span>
                Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, data.meta.total)} / {data.meta.total}
              </span>
              <label className="flex items-center gap-1.5">
                Số dòng/trang
                <Select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-8 w-20 py-0 text-small"
                  aria-label="Số dòng mỗi trang"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Trang trước"
                  className="rounded p-1 hover:bg-background disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Trang sau"
                  className="rounded p-1 hover:bg-background disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} defaultListId={listId} />

      <TaskFormModal open={!!editingTask} onClose={() => setEditingTask(undefined)} task={editingTask} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={() => deleteTarget && deleteTask(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) })}
        title="Xoá công việc?"
        description={`"${deleteTarget?.title}" sẽ được lưu trữ và không còn hiển thị trong danh sách.`}
        confirmLabel="Xoá"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Xoá công việc đã chọn?"
        description={`${selectedIds.size} công việc sẽ được lưu trữ và không còn hiển thị trong danh sách.`}
        confirmLabel="Xoá"
        isLoading={isBulkDeleting}
      />
    </div>
  );
};
