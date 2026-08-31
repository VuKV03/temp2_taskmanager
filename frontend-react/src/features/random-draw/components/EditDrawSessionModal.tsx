import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Label, Textarea } from '../../../shared/components/ui';
import { useUpdateDrawSession } from '../hooks/useUpdateDrawSession';
import { parseManualItems } from '../utils/parse-items';
import type { DrawSessionDetail } from '../types/random-draw.types';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phiên').max(100),
  addItemsText: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditDrawSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: DrawSessionDetail;
}

export const EditDrawSessionModal = ({ open, onClose, session }: EditDrawSessionModalProps) => {
  const { mutate: update, isPending } = useUpdateDrawSession(session.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: session.name, addItemsText: '' },
  });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    const addItems = parseManualItems(values.addItemsText ?? '');
    update(
      { name: values.name, ...(addItems.length > 0 ? { addItems } : {}) },
      { onSuccess: close },
    );
  };

  return (
    <Modal open={open} onClose={close} title="Sửa phiên bốc thăm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="edit-draw-name">Tên phiên</Label>
          <Input id="edit-draw-name" error={!!errors.name} {...register('name')} />
          {errors.name && <p className="mt-1 text-small text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="edit-draw-items">Thêm công việc mới vào ngân hàng (không bắt buộc)</Label>
          <Textarea
            id="edit-draw-items"
            rows={4}
            placeholder={'Voc 101\nVoc 102\n...'}
            {...register('addItemsText')}
          />
          <p className="mt-1 text-small text-text-muted">
            Muốn bỏ bớt việc chưa bốc thì bấm dấu × ngay trên thẻ việc đó ở "Ngân hàng còn lại".
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" isLoading={isPending}>
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
};
