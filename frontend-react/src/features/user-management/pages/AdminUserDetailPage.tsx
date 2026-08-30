import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ShieldCheck, Lock, Unlock, KeyRound } from 'lucide-react';
import { Badge, Button } from '../../../shared/components/ui';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { formatDateTime } from '../../../shared/lib/datetime';
import { useAuthStore } from '../../../features/auth';
import { ROUTES } from '../../../routes/routes';
import { useUserDetail } from '../hooks/useUserDetail';
import { RoleChangeDialog } from '../components/RoleChangeDialog';
import { LockAccountDialog } from '../components/LockAccountDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';

export const AdminUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: user, isLoading, isError, refetch } = useUserDetail(userId);

  const [showRole, setShowRole] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const isSelf = userId !== undefined && userId === currentUserId;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(ROUTES.ADMIN_USERS)}
        className="flex items-center gap-1 text-small text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </button>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được thông tin người dùng." onRetry={() => refetch()} />}

      {user && (
        <>
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1>{user.fullName}</h1>
                <p className="text-body text-text-muted">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={user.role === 'admin' ? 'bg-primary/10 text-primary' : undefined}>
                  {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                </Badge>
                <Badge
                  className={
                    user.isActive ? 'bg-status-done text-status-done-text' : 'bg-status-cancelled text-status-cancelled-text'
                  }
                >
                  {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                </Badge>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-small sm:grid-cols-4">
              <div>
                <dt className="text-text-muted">Múi giờ</dt>
                <dd className="text-text">{user.timezone}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Đăng nhập gần nhất</dt>
                <dd className="text-text">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Chưa đăng nhập'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Tạo lúc</dt>
                <dd className="text-text">{formatDateTime(user.createdAt)}</dd>
              </div>
            </dl>

            {!isSelf && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="secondary" size="sm" onClick={() => setShowRole(true)}>
                  <ShieldCheck className="h-4 w-4" />
                  Đổi role
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowStatus(true)}>
                  {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {user.isActive ? 'Khoá tài khoản' : 'Mở khoá'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowReset(true)}>
                  <KeyRound className="h-4 w-4" />
                  Reset mật khẩu
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-body font-semibold text-text">Thống kê công việc</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-h2 font-heading font-semibold text-text">{user.taskStats.total}</p>
                <p className="text-small text-text-muted">Tổng số việc</p>
              </div>
              <div>
                <p className="text-h2 font-heading font-semibold text-text">{user.taskStats.completed}</p>
                <p className="text-small text-text-muted">Hoàn thành</p>
              </div>
            </div>
          </div>
        </>
      )}

      <RoleChangeDialog user={showRole ? user : undefined} onClose={() => setShowRole(false)} />
      <LockAccountDialog user={showStatus ? user : undefined} onClose={() => setShowStatus(false)} />
      <ResetPasswordDialog user={showReset ? user : undefined} onClose={() => setShowReset(false)} />
    </div>
  );
};
