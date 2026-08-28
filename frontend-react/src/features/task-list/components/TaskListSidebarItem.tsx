import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NavLink } from 'react-router';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';
import { ROUTES } from '../../../routes/routes';
import type { TaskList } from '../types/task-list.types';

interface TaskListSidebarItemProps {
  list: TaskList;
  onEdit: (list: TaskList) => void;
  onDelete: (list: TaskList) => void;
}

export const TaskListSidebarItem = ({ list, onEdit, onDelete }: TaskListSidebarItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1 rounded-md hover:bg-background">
      <button
        {...attributes}
        {...listeners}
        aria-label={`Kéo để sắp xếp lại ${list.name}`}
        className="cursor-grab touch-none p-1 text-text-muted opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <NavLink
        to={ROUTES.LIST_DETAIL.replace(':id', String(list.id))}
        className={({ isActive }) =>
          cn(
            'flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-body',
            isActive ? 'bg-primary/10 font-medium text-primary' : 'text-text',
          )
        }
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: list.color ?? '#9CA3AF' }}
          aria-hidden="true"
        />
        <span className="truncate">{list.name}</span>
      </NavLink>

      <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
        <button
          aria-label={`Sửa ${list.name}`}
          onClick={() => onEdit(list)}
          className="rounded p-1 text-text-muted hover:text-text"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label={`Xoá ${list.name}`}
          onClick={() => onDelete(list)}
          className="rounded p-1 text-text-muted hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
