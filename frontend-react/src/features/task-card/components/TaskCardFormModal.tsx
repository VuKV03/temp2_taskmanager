import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Label } from '../../../shared/components/ui';
import { useCreateTaskCard } from '../hooks/useCreateTaskCard';
import { useUpdateTaskCard } from '../hooks/useUpdateTaskCard';
import type { TaskCard } from '../types/task-card.types';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên thẻ').max(100),
});

type FormValues = z.infer<typeof schema>;

interface TaskCardFormModalProps {
  open: boolean;
  onClose: () => void;
  card?: TaskCard;
}

export const TaskCardFormModal = ({ open, onClose, card }: TaskCardFormModalProps) => {
  const isEdit = !!card;
  const { mutate: create, isPending: isCreating } = useCreateTaskCard();
  const { mutate: update, isPending: isUpdating } = useUpdateTaskCard();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: card?.name ?? '' },
  });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      update({ id: card.id, payload: { name: values.name } }, { onSuccess: close });
    } else {
      create({ name: values.name }, { onSuccess: close });
    }
  };

  return (
    <Modal open={open} onClose={close} title={isEdit ? 'Sửa thẻ' : 'Thẻ mới'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="card-name">Tên thẻ</Label>
          <Input
            id="card-name"
            placeholder="Ví dụ: Hôm nay, Ngày mai, Lễ 2/9..."
            error={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-small text-red-600">{errors.name.message}</p>}
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
