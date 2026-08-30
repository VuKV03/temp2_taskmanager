import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskItem } from './TaskItem';
import type { Task } from '../types/task.types';

interface SortableTaskItemProps {
  task: Task;
  onOpenDetail: (id: number) => void;
}

export const SortableTaskItem = ({ task, onOpenDetail }: SortableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative flex items-center bg-surface">
      <button
        {...attributes}
        {...listeners}
        aria-label={`Kéo để sắp xếp lại ${task.title}`}
        className="cursor-grab touch-none px-1 text-text-muted opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <TaskItem task={task} onOpenDetail={onOpenDetail} />
      </div>
    </div>
  );
};
