import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { useList } from '../../../features/task-list';
import { useTasks } from '../hooks/useTasks';
import { useReorderTasks } from '../hooks/useReorderTasks';
import { TaskList } from '../components/TaskList';
import { TaskFilters } from '../components/TaskFilters';
import { TaskFormModal } from '../components/TaskFormModal';
import { ROUTES } from '../../../routes/routes';
import type { TaskParams, TaskStatus, TaskPriority } from '../types/task.types';

export const TaskListPage = () => {
  const { id } = useParams<{ id: string }>();
  const listId = id ? Number(id) : undefined;
  const { data: list } = useList(listId);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const { mutate: reorder } = useReorderTasks();

  const page = Number(searchParams.get('page') ?? '1');
  const status = searchParams.get('status')?.split(',').filter(Boolean) as TaskStatus[] | undefined;
  const priority = searchParams.get('priority')?.split(',').filter(Boolean) as TaskPriority[] | undefined;
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean).map(Number);
  const q = searchParams.get('q') || undefined;

  const params: TaskParams = { page, limit: 20, status, priority, tagIds, q, listId };
  const { data, isLoading, isError, refetch } = useTasks(params);

  const openDetail = (taskId: number) => navigate(ROUTES.TASK_DETAIL.replace(':id', String(taskId)));

  const hasActiveFilters = !!(status?.length || priority?.length || tagIds?.length || q);

  const setPage = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
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
          <TaskList
            tasks={data.data}
            onOpenDetail={openDetail}
            draggable={!hasActiveFilters}
            onReorder={(reordered) => reorder(reordered.map((t, index) => ({ id: t.id, sortOrder: index })))}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-small text-text-muted">
              <span>
                Hiển thị {(page - 1) * 20 + 1}–{Math.min(page * 20, data.meta.total)} / {data.meta.total}
              </span>
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
            </div>
          )}
        </>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} defaultListId={listId} />
    </div>
  );
};
