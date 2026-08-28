import { useState } from 'react';
import { NavLink } from 'react-router';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CalendarCheck, ListTodo, History, BarChart3, Plus } from 'lucide-react';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { ConfirmDialog } from '../../../shared/components/ui';
import { cn } from '../../../shared/utils/cn';
import { ROUTES } from '../../../routes/routes';
import { useLists } from '../hooks/useLists';
import { useDeleteList } from '../hooks/useDeleteList';
import { useReorderLists } from '../hooks/useReorderLists';
import { TaskListSidebarItem } from './TaskListSidebarItem';
import { ListForm } from './ListForm';
import type { TaskList } from '../types/task-list.types';

const quickLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-body',
    isActive ? 'bg-primary/10 font-medium text-primary' : 'text-text hover:bg-background',
  );

export const TaskListSidebar = () => {
  const { data: lists, isLoading, isError, refetch } = useLists();
  const { mutate: deleteList, isPending: isDeleting } = useDeleteList();
  const { mutate: reorder } = useReorderLists();

  const [formOpen, setFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | undefined>();
  const [deletingList, setDeletingList] = useState<TaskList | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openCreate = () => {
    setEditingList(undefined);
    setFormOpen(true);
  };
  const openEdit = (list: TaskList) => {
    setEditingList(list);
    setFormOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !lists) return;

    const oldIndex = lists.findIndex((l) => l.id === active.id);
    const newIndex = lists.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...lists];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorder(reordered.map((list, index) => ({ id: list.id, sortOrder: index })));
  };

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Điều hướng chính">
      <NavLink to={ROUTES.TODAY} end className={quickLinkClass}>
        <CalendarCheck className="h-4 w-4" />
        Hôm nay
      </NavLink>
      <NavLink to={ROUTES.TASKS} className={quickLinkClass}>
        <ListTodo className="h-4 w-4" />
        Tất cả công việc
      </NavLink>
      <NavLink to={ROUTES.HISTORY} className={quickLinkClass}>
        <History className="h-4 w-4" />
        Lịch sử
      </NavLink>
      <NavLink to={ROUTES.STATISTIC} className={quickLinkClass}>
        <BarChart3 className="h-4 w-4" />
        Thống kê
      </NavLink>

      <div className="mt-4 flex items-center justify-between px-2">
        <span className="text-small font-semibold uppercase tracking-wide text-text-muted">Danh sách</span>
        <button
          onClick={openCreate}
          aria-label="Thêm danh sách"
          className="rounded p-1 text-text-muted hover:bg-background hover:text-text"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2 px-2 py-1">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được danh sách." onRetry={() => refetch()} />}

      {lists && lists.length === 0 && (
        <p className="px-2 py-1 text-small text-text-muted">Chưa có danh sách nào.</p>
      )}

      {lists && lists.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lists.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {lists.map((list) => (
                <TaskListSidebarItem key={list.id} list={list} onEdit={openEdit} onDelete={setDeletingList} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ListForm open={formOpen} onClose={() => setFormOpen(false)} list={editingList} />

      <ConfirmDialog
        open={!!deletingList}
        onClose={() => setDeletingList(undefined)}
        onConfirm={() => {
          if (deletingList) deleteList(deletingList.id, { onSuccess: () => setDeletingList(undefined) });
        }}
        title="Lưu trữ danh sách?"
        description={`"${deletingList?.name}" sẽ được lưu trữ. Các công việc trong danh sách vẫn được giữ nguyên.`}
        confirmLabel="Lưu trữ"
        isLoading={isDeleting}
      />
    </nav>
  );
};
