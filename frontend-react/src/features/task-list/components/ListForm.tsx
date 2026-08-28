import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Label, Textarea } from '../../../shared/components/ui';
import { useCreateList } from '../hooks/useCreateList';
import { useUpdateList } from '../hooks/useUpdateList';
import type { TaskList } from '../types/task-list.types';

const COLORS = ['#4F46E5', '#DC2626', '#EA580C', '#CA8A04', '#059669', '#0891B2', '#7C3AED', '#DB2777'];

const listSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên danh sách').max(100),
  description: z.string().max(255).optional(),
  color: z.string().optional(),
});

type ListFormValues = z.infer<typeof listSchema>;

interface ListFormProps {
  open: boolean;
  onClose: () => void;
  list?: TaskList;
}

export const ListForm = ({ open, onClose, list }: ListFormProps) => {
  const isEdit = !!list;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ListFormValues>({
    resolver: zodResolver(listSchema),
    values: { name: list?.name ?? '', description: list?.description ?? '', color: list?.color ?? COLORS[0] },
  });
  const selectedColor = watch('color');

  const { mutate: create, isPending: isCreating } = useCreateList();
  const { mutate: update, isPending: isUpdating } = useUpdateList();
  const isPending = isCreating || isUpdating;

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: ListFormValues) => {
    const payload = { name: values.name, description: values.description || undefined, color: values.color };
    if (isEdit) {
      update({ id: list.id, payload }, { onSuccess: close });
    } else {
      create(payload, { onSuccess: close });
    }
  };

  return (
    <Modal open={open} onClose={close} title={isEdit ? 'Sửa danh sách' : 'Danh sách mới'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="list-name">Tên danh sách</Label>
          <Input id="list-name" error={!!errors.name} {...register('name')} />
          {errors.name && <p className="mt-1 text-small text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="list-description">Mô tả</Label>
          <Textarea id="list-description" rows={2} {...register('description')} />
        </div>

        <div>
          <Label>Màu</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Chọn màu ${color}`}
                onClick={() => setValue('color', color)}
                className={`h-7 w-7 rounded-full ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
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
