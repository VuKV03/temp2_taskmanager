import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button, Select, ConfirmDialog } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { TaskCardGrid, useTaskCards } from '../../../features/task-card';
import { useTasks } from '../hooks/useTasks';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useBulkDeleteTasks } from '../hooks/useBulkDeleteTasks';
import { useStartTask } from '../hooks/useStartTask';
import { TaskTable } from '../components/TaskTable';
import { TaskFilters } from '../components/TaskFilters';
import { TaskFormModal } from '../components/TaskFormModal';
import { AddTaskToCardDrawer } from '../components/AddTaskToCardDrawer';
import { ROUTES } from '../../../routes/routes';
import type { Task, TaskParams, TaskStatus, TaskPriority } from '../types/task.types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const TaskCardPage = () => {
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [gridFormOpen, setGridFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDefaultCardId, setPickerDefaultCardId] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaultCardId, setFormDefaultCardId] = useState<number | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Task | undefined>();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cards } = useTaskCards();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: bulkDeleteTasks, isPending: isBulkDeleting } = useBulkDeleteTasks();
  const { startTask } = useStartTask();

  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '20');
  const status = searchParams.get('status')?.split(',').filter(Boolean) as TaskStatus[] | undefined;
  const priority = searchParams.get('priority')?.split(',').filter(Boolean) as TaskPriority[] | undefined;
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean).map(Number);
  const q = searchParams.get('q') || undefined;
  const sort = (searchParams.get('sort') ?? undefined) as TaskParams['sort'];
  const order = (searchParams.get('order') ?? undefined) as TaskParams['order'];

  const params: TaskParams = { page, limit, status, priority, tagIds, q, sort, order, cardId: selectedCardId };
  const { data, isLoading, isError, refetch } = useTasks(params, { enabled: selectedCardId !== undefined });
  const card = cards?.find((c) => c.id === selectedCardId);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, status?.join(','), priority?.join(','), tagIds?.join(','), q, sort, order, selectedCardId]);

  const selectCard = (id: number) => {
    setSearchParams({});
    setSelectedCardId(id);
  };

  const backToGrid = () => {
    setSearchParams({});
    setSelectedCardId(undefined);
  };

  const openDetail = (taskId: number) => navigate(ROUTES.TASK_DETAIL.replace(':id', String(taskId)));

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
    bulkDeleteTasks(Array.from(selectedIds).map(Number), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      },
    });
  };

  const openPicker = (cardId?: number) => {
    setPickerDefaultCardId(cardId);
    setPickerOpen(true);
  };

  const openCreateForm = (cardId: number | undefined) => {
    setPickerOpen(false);
    setFormDefaultCardId(cardId);
    setFormOpen(true);
  };

  const hasActiveFilters = !!(status?.length || priority?.length || tagIds?.length || q);
  const totalPages = data?.meta.totalPages ?? 0;

  if (selectedCardId === undefined) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1>Công việc</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => openPicker()}>
              <Plus className="h-4 w-4" />
              Thêm việc
            </Button>
            <Button onClick={() => setGridFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Thẻ mới
            </Button>
          </div>
        </div>

        <TaskCardGrid onSelect={selectCard} formOpen={gridFormOpen} onCloseForm={() => setGridFormOpen(false)} />

        <AddTaskToCardDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          defaultCardId={pickerDefaultCardId}
          onCreateNew={openCreateForm}
        />
        <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} defaultCardId={formDefaultCardId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={backToGrid}
            aria-label="Quay lại danh sách thẻ"
            className="rounded p-1.5 text-text-muted hover:bg-background hover:text-text"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1>{card?.name ?? 'Thẻ'}</h1>
        </div>
        <Button onClick={() => openPicker(selectedCardId)}>
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
          icon="🗂️"
          title="Thẻ này chưa có công việc nào"
          description="Thêm việc có sẵn vào thẻ, hoặc tạo việc mới."
          action={{ label: 'Thêm việc', onClick: () => openPicker(selectedCardId) }}
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

      <AddTaskToCardDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        defaultCardId={pickerDefaultCardId}
        onCreateNew={openCreateForm}
      />

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} defaultCardId={formDefaultCardId} />

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
