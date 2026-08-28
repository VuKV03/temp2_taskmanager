import { ConfirmDialog } from '../../../shared/components/ui';
import { useUpdateUserStatus } from '../hooks/useUpdateUserStatus';
import type { AdminUser } from '../types/user-management.types';

interface LockAccountDialogProps {
  user: AdminUser | undefined;
  onClose: () => void;
}

export const LockAccountDialog = ({ user, onClose }: LockAccountDialogProps) => {
  const { mutate: updateStatus, isPending } = useUpdateUserStatus();
  const willLock = user?.isActive ?? true;

  return (
    <ConfirmDialog
      open={!!user}
      onClose={onClose}
      onConfirm={() => {
        if (user) updateStatus({ id: user.id, isActive: !willLock }, { onSuccess: onClose });
      }}
      title={willLock ? 'Khoá tài khoản?' : 'Mở khoá tài khoản?'}
      description={
        willLock
          ? `"${user?.fullName}" sẽ không thể đăng nhập và bị đăng xuất khỏi mọi thiết bị.`
          : `"${user?.fullName}" sẽ có thể đăng nhập trở lại.`
      }
      confirmLabel={willLock ? 'Khoá' : 'Mở khoá'}
      isDangerous={willLock}
      isLoading={isPending}
    />
  );
};
