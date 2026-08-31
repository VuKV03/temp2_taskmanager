import { useState } from 'react';
import { Pencil, Trash2, LayoutGrid } from 'lucide-react';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { ConfirmDialog } from '../../../shared/components/ui';
import { useTaskCards } from '../hooks/useTaskCards';
import { useDeleteTaskCard } from '../hooks/useDeleteTaskCard';
import { TaskCardFormModal } from './TaskCardFormModal';
import type { TaskCard } from '../types/task-card.types';

interface TaskCardGridProps {
  onSelect: (cardId: number) => void;
  formOpen: boolean;
  onCloseForm: () => void;
}

export const TaskCardGrid = ({ onSelect, formOpen, onCloseForm }: TaskCardGridProps) => {
  const { data: cards, isLoading, isError, refetch } = useTaskCards();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteTaskCard();
  const [editingCard, setEditingCard] = useState<TaskCard | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<TaskCard | undefined>();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Không tải được các thẻ." onRetry={() => refetch()} />;
  }

  return (
    <>
      {cards && cards.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="Chưa có thẻ nào"
          description="Tạo thẻ đầu tiên (ví dụ 'Hôm nay', 'Ngày mai'...) để bắt đầu gom việc lại."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards?.map((card) => (
            <div
              key={card.id}
              className="group relative rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <button onClick={() => onSelect(card.id)} className="flex w-full flex-col items-start gap-2 text-left">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <p className="truncate text-body font-semibold text-text">{card.name}</p>
                <p className="text-small text-text-muted">{card.taskCount} công việc</p>
              </button>

              <div className="absolute right-2 top-2 flex opacity-0 group-hover:opacity-100">
                <button
                  aria-label={`Sửa ${card.name}`}
                  onClick={() => setEditingCard(card)}
                  className="rounded p-1 text-text-muted hover:bg-background hover:text-text"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label={`Xoá ${card.name}`}
                  onClick={() => setDeleteTarget(card)}
                  className="rounded p-1 text-text-muted hover:bg-background hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskCardFormModal open={formOpen} onClose={onCloseForm} />
      <TaskCardFormModal open={!!editingCard} onClose={() => setEditingCard(undefined)} card={editingCard} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={() =>
          deleteTarget && deleteCard(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) })
        }
        title="Xoá thẻ?"
        description={`"${deleteTarget?.name}" sẽ bị xoá. Các công việc trong thẻ vẫn được giữ nguyên, chỉ mất liên kết với thẻ này.`}
        confirmLabel="Xoá"
        isLoading={isDeleting}
      />
    </>
  );
};
