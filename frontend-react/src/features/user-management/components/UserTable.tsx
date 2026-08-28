import { Link } from 'react-router';
import { Badge } from '../../../shared/components/ui';
import { formatDateTime } from '../../../shared/lib/datetime';
import { ROUTES } from '../../../routes/routes';
import { useAuthStore } from '../../../features/auth';
import { UserActionMenu } from './UserActionMenu';
import type { AdminUser } from '../types/user-management.types';

interface UserTableProps {
  users: AdminUser[];
  onChangeRole: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
}

export const UserTable = ({ users, onChangeRole, onToggleStatus, onResetPassword }: UserTableProps) => {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-body">
        <thead className="border-b border-border bg-background text-small text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Người dùng</th>
            <th className="px-3 py-2 font-medium">Vai trò</th>
            <th className="px-3 py-2 font-medium">Trạng thái</th>
            <th className="px-3 py-2 font-medium">Đăng nhập gần nhất</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-3 py-2">
                <Link to={ROUTES.ADMIN_USER_DETAIL.replace(':id', String(user.id))} className="text-text hover:text-primary">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-small text-text-muted">{user.email}</p>
                </Link>
              </td>
              <td className="px-3 py-2">
                <Badge className={user.role === 'admin' ? 'bg-primary/10 text-primary' : undefined}>
                  {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                </Badge>
              </td>
              <td className="px-3 py-2">
                <Badge className={user.isActive ? 'bg-status-done text-status-done-text' : 'bg-status-cancelled text-status-cancelled-text'}>
                  {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                </Badge>
              </td>
              <td className="px-3 py-2 text-text-muted">
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Chưa đăng nhập'}
              </td>
              <td className="px-3 py-2 text-right">
                <UserActionMenu
                  user={user}
                  isSelf={user.id === currentUserId}
                  onChangeRole={() => onChangeRole(user)}
                  onToggleStatus={() => onToggleStatus(user)}
                  onResetPassword={() => onResetPassword(user)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
