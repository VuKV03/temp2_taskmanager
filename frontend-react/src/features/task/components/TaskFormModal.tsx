import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { Modal, Button, Input, Label, Textarea, Select } from '../../../shared/components/ui';
import { useLists } from '../../../features/task-list';
import { useTaskCards } from '../../../features/task-card';
import { useCreateTask } from '../hooks/useCreateTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { TagPicker } from './TagPicker';
import { TASK_PRIORITY_LABEL } from '../types/task.types';
import type { Task, TaskPriority, TagSummary } from '../types/task.types';

const taskSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(255),
  description: z.string().optional(),
  listId: z.string().optional(),
  cardId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  estimateMinutes: z.string().optional(),
  points: z.string().min(1, 'Vui lòng nhập khối lượng (point)'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultListId?: number;
  /** Pre-selects "Thẻ" for a new task — e.g. "Thêm việc" launched from inside a specific card. */
  defaultCardId?: number;
  /** Datetime-local string (`yyyy-MM-dd'T'HH:mm`) to pre-fill "Hạn chót" for a new task — e.g. Today's "Thêm việc". */
  defaultDueDate?: string;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  return DateTime.fromISO(iso).toFormat("yyyy-MM-dd'T'HH:mm");
}

export const TaskFormModal = ({
  open,
  onClose,
  task,
  defaultListId,
  defaultCardId,
  defaultDueDate,
}: TaskFormModalProps) => {
  const isEdit = !!task;
  const { data: lists } = useLists();
  const { data: cards } = useTaskCards();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const isPending = isCreating || isUpdating;

  const [tags, setTags] = useState<TagSummary[]>(task?.tags ?? []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    values: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      listId: task?.list ? String(task.list.id) : defaultListId ? String(defaultListId) : '',
      cardId: task?.cardId ? String(task.cardId) : defaultCardId ? String(defaultCardId) : '',
      priority: (task?.priority ?? 'medium') as TaskPriority,
      dueDate: task?.dueDate ? toDatetimeLocal(task.dueDate) : (defaultDueDate ?? ''),
      estimateMinutes: task?.estimateMinutes ? String(task.estimateMinutes) : '',
      points: task?.points !== null && task?.points !== undefined ? String(task.points) : '',
    },
  });

  const close = () => {
    reset();
    setTags(task?.tags ?? []);
    onClose();
  };

  const onSubmit = (values: TaskFormValues) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      listId: values.listId ? Number(values.listId) : null,
      cardId: values.cardId ? Number(values.cardId) : null,
      priority: values.priority,
      dueDate: values.dueDate ? DateTime.fromISO(values.dueDate).toUTC().toISO()! : undefined,
      estimateMinutes: values.estimateMinutes ? Number(values.estimateMinutes) : undefined,
      points: Number(values.points),
      // `t.id` comes back from the API as a numeric string (bigint), even though
      // `TagSummary.id` is typed `number` — normalize before sending, or the
      // backend's `@IsInt({ each: true })` on tagIds rejects the request.
      tagIds: tags.map((t) => Number(t.id)),
    };

    if (isEdit) {
      updateTask({ id: task.id, payload }, { onSuccess: close });
    } else {
      createTask(payload, { onSuccess: close });
    }
  };

  return (
    <Modal open={open} onClose={close} title={isEdit ? 'Sửa công việc' : 'Thêm việc'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="task-title">Tiêu đề</Label>
          <Input id="task-title" error={!!errors.title} {...register('title')} />
          {errors.title && <p className="mt-1 text-small text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="task-description">Mô tả</Label>
          <Textarea id="task-description" rows={3} {...register('description')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-list">Danh sách</Label>
            <Select id="task-list" {...register('listId')}>
              <option value="">Không thuộc danh sách</option>
              {lists?.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="task-priority">Ưu tiên</Label>
            <Select id="task-priority" {...register('priority')}>
              {Object.entries(TASK_PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-card">Thẻ</Label>
            <Select id="task-card" {...register('cardId')}>
              <option value="">Không thuộc thẻ nào</option>
              {cards?.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="task-due-date">Hạn chót</Label>
            <Input id="task-due-date" type="datetime-local" {...register('dueDate')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-estimate">Thời lượng (phút)</Label>
            <Input id="task-estimate" type="number" min={1} {...register('estimateMinutes')} />
          </div>
          <div>
            <Label htmlFor="task-points">Khối lượng (point, 1 point ≈ 1 ngày)</Label>
            <Input
              id="task-points"
              type="number"
              min={0}
              step={0.1}
              error={!!errors.points}
              {...register('points')}
            />
            {errors.points && <p className="mt-1 text-small text-red-600">{errors.points.message}</p>}
          </div>
        </div>

        <div>
          <Label>Nhãn</Label>
          <TagPicker value={tags} onChange={setTags} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEdit ? 'Lưu' : 'Tạo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
