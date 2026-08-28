import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskItem } from './TaskItem';
import { SortableTaskItem } from './SortableTaskItem';
import type { Task } from '../types/task.types';

interface TaskListProps {
  tasks: Task[];
  onOpenDetail: (id: number) => void;
  isOverdue?: boolean;
  draggable?: boolean;
  onReorder?: (tasks: Task[]) => void;
}

export const TaskList = ({ tasks, onOpenDetail, isOverdue, draggable, onReorder }: TaskListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!draggable) {
    return (
      <div className="overflow-hidden rounded-md border border-border">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onOpenDetail={onOpenDetail} isOverdue={isOverdue} />
        ))}
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder?.(reordered);
  };

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskItem key={task.id} task={task} onOpenDetail={onOpenDetail} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
