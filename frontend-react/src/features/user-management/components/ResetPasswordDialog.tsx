import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input, Label } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { useResetUserPassword } from '../hooks/useResetUserPassword';
import type { AdminUser } from '../types/user-management.types';

interface ResetPasswordDialogProps {
  user: AdminUser | undefined;
  onClose: () => void;
}

export const ResetPasswordDialog = ({ user, onClose }: ResetPasswordDialogProps) => {
  const [newPassword, setNewPassword] = useState('');
  const { mutate: resetPassword, isPending } = useResetUserPassword();

  const close = () => {
    setNewPassword('');
    onClose();
  };

  const submit = () => {
    if (!user || newPassword.length < 8) return;
    resetPassword(
      { id: user.id, newPassword },
      {
        onSuccess: () => {
          toast.success('Đã đặt lại mật khẩu — người dùng bị đăng xuất khỏi mọi thiết bị');
          close();
        },
        onError: (err) => toast.error(getErrorMessage(err.code)),
      },
    );
  };

  return (
    <Modal
      open={!!user}
      onClose={close}
      title="Đặt lại mật khẩu"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button onClick={submit} isLoading={isPending} disabled={newPassword.length < 8}>
            Đặt lại
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-body text-text-muted">
          Đặt mật khẩu mới cho "{user?.fullName}". Người dùng sẽ bị đăng xuất khỏi mọi thiết bị và cần đăng nhập lại
          bằng mật khẩu mới.
        </p>
        <div>
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
          />
        </div>
      </div>
    </Modal>
  );
};
