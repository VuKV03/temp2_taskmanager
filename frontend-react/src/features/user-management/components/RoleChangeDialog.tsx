import { ConfirmDialog } from '../../../shared/components/ui';
import { useUpdateUserRole } from '../hooks/useUpdateUserRole';
import type { AdminUser } from '../types/user-management.types';

interface RoleChangeDialogProps {
  user: AdminUser | undefined;
  onClose: () => void;
}

const ROLE_LABEL = { admin: 'Quản trị viên', member: 'Thành viên' } as const;

export const RoleChangeDialog = ({ user, onClose }: RoleChangeDialogProps) => {
  const { mutate: updateRole, isPending } = useUpdateUserRole();
  const nextRole = user?.role === 'admin' ? 'member' : 'admin';

  return (
    <ConfirmDialog
      open={!!user}
      onClose={onClose}
      onConfirm={() => {
        if (user) updateRole({ id: user.id, role: nextRole }, { onSuccess: onClose });
      }}
      title="Đổi vai trò người dùng?"
      description={`Chuyển "${user?.fullName}" sang vai trò ${ROLE_LABEL[nextRole]}. Người dùng sẽ bị đăng xuất khỏi mọi thiết bị và cần đăng nhập lại.`}
      confirmLabel="Đổi role"
      isDangerous={false}
      isLoading={isPending}
    />
  );
};
