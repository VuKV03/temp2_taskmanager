import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Label, Select, Textarea } from '../../../shared/components/ui';
import { useLists } from '../../task-list';
import { useCreateDrawSession } from '../hooks/useCreateDrawSession';
import { parseManualItems } from '../utils/parse-items';
import type { DrawSourceType } from '../types/random-draw.types';

const schema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên phiên').max(100),
    sourceType: z.enum(['task_list', 'manual']),
    sourceListId: z.string().optional(),
    itemsText: z.string().optional(),
  })
  .refine((data) => data.sourceType !== 'task_list' || !!data.sourceListId, {
    message: 'Vui lòng chọn danh sách',
    path: ['sourceListId'],
  })
  .refine((data) => data.sourceType !== 'manual' || !!data.itemsText?.trim(), {
    message: 'Vui lòng nhập ít nhất một công việc',
    path: ['itemsText'],
  });

type FormValues = z.infer<typeof schema>;

interface CreateDrawSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: number) => void;
}

export const CreateDrawSessionModal = ({ open, onClose, onCreated }: CreateDrawSessionModalProps) => {
  const { data: lists } = useLists();
  const { mutate: create, isPending } = useCreateDrawSession();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', sourceType: 'task_list' as DrawSourceType, sourceListId: '', itemsText: '' },
  });
  const sourceType = watch('sourceType');

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    const payload =
      values.sourceType === 'task_list'
        ? { name: values.name, sourceType: 'task_list' as const, sourceListId: Number(values.sourceListId) }
        : { name: values.name, sourceType: 'manual' as const, items: parseManualItems(values.itemsText ?? '') };

    create(payload, {
      onSuccess: (res) => {
        close();
        onCreated(res.data!.id);
      },
    });
  };

  return (
    <Modal open={open} onClose={close} title="Phiên bốc thăm mới">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="draw-name">Tên phiên</Label>
          <Input
            id="draw-name"
            placeholder="Ví dụ: Phân việc tuần này"
            error={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-small text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <Label>Nguồn công việc</Label>
          <div className="flex gap-4 py-1">
            <label className="flex items-center gap-2 text-body text-text">
              <input type="radio" value="task_list" {...register('sourceType')} />
              Từ danh sách có sẵn
            </label>
            <label className="flex items-center gap-2 text-body text-text">
              <input type="radio" value="manual" {...register('sourceType')} />
              Nhập tay
            </label>
          </div>
        </div>

        {sourceType === 'task_list' ? (
          <div>
            <Label htmlFor="draw-list">Danh sách công việc</Label>
            <Select id="draw-list" error={!!errors.sourceListId} {...register('sourceListId')}>
              <option value="">-- Chọn danh sách --</option>
              {lists?.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
            {errors.sourceListId && <p className="mt-1 text-small text-red-600">{errors.sourceListId.message}</p>}
          </div>
        ) : (
          <div>
            <Label htmlFor="draw-items">Danh sách công việc (mỗi dòng hoặc cách nhau bởi dấu phẩy)</Label>
            <Textarea
              id="draw-items"
              rows={6}
              placeholder={'Voc 1\nVoc 2\nVoc 3\n...'}
              error={!!errors.itemsText}
              {...register('itemsText')}
            />
            {errors.itemsText && <p className="mt-1 text-small text-red-600">{errors.itemsText.message}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" isLoading={isPending}>
            Tạo phiên
          </Button>
        </div>
      </form>
    </Modal>
  );
};
