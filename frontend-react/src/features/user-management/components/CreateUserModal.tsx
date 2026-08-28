import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input, Label, Select } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { useCreateUser } from '../hooks/useCreateUser';
import type { UserRole } from '../types/user-management.types';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

const initial = { email: '', password: '', fullName: '', role: 'member' as UserRole };

export const CreateUserModal = ({ open, onClose }: CreateUserModalProps) => {
  const [form, setForm] = useState(initial);
  const { mutate: createUser, isPending } = useCreateUser();

  const close = () => {
    setForm(initial);
    onClose();
  };

  const isValid = form.email.includes('@') && form.password.length >= 8 && form.fullName.trim().length > 0;

  const submit = () => {
    if (!isValid) return;
    createUser(form, {
      onSuccess: () => {
        toast.success('Đã tạo người dùng');
        close();
      },
      onError: (err) => toast.error(getErrorMessage(err.code)),
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Thêm người dùng"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button onClick={submit} isLoading={isPending} disabled={!isValid}>
            Tạo
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="new-user-fullname">Họ tên</Label>
          <Input id="new-user-fullname" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="new-user-email">Email</Label>
          <Input
            id="new-user-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="new-user-password">Mật khẩu</Label>
          <Input
            id="new-user-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="new-user-role">Vai trò</Label>
          <Select
            id="new-user-role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
          >
            <option value="member">Thành viên</option>
            <option value="admin">Quản trị viên</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
};
