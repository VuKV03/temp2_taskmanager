import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Users, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input, Select } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { UserTable } from '../components/UserTable';
import { RoleChangeDialog } from '../components/RoleChangeDialog';
import { LockAccountDialog } from '../components/LockAccountDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { CreateUserModal } from '../components/CreateUserModal';
import { useUsers } from '../hooks/useUsers';
import type { AdminUser } from '../types/user-management.types';

export const AdminUserListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const role = (searchParams.get('role') as 'admin' | 'member' | null) ?? undefined;
  const isActiveParam = searchParams.get('isActive');
  const isActive = isActiveParam === null ? undefined : isActiveParam === 'true';

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const debouncedQ = useDebounce(q, 400);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AdminUser | undefined>();
  const [statusTarget, setStatusTarget] = useState<AdminUser | undefined>();
  const [resetTarget, setResetTarget] = useState<AdminUser | undefined>();

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: 20,
    role,
    isActive,
    q: debouncedQ || undefined,
  });

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      return next;
    });
  };

  const setPage = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-text-muted" />
          <h1>Người dùng</h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-body font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-64 pl-9"
            aria-label="Tìm người dùng"
          />
        </div>
        <Select value={role ?? ''} onChange={(e) => setParam('role', e.target.value)} className="w-40" aria-label="Lọc theo vai trò">
          <option value="">Mọi vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="member">Thành viên</option>
        </Select>
        <Select
          value={isActiveParam ?? ''}
          onChange={(e) => setParam('isActive', e.target.value)}
          className="w-40"
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Mọi trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã khoá</option>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được danh sách người dùng." onRetry={() => refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState icon="👤" title="Không có người dùng nào" description="Không có người dùng nào khớp bộ lọc." />
      )}

      {data && data.data.length > 0 && (
        <>
          <UserTable
            users={data.data}
            onChangeRole={setRoleTarget}
            onToggleStatus={setStatusTarget}
            onResetPassword={setResetTarget}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-small text-text-muted">
              <span>
                Trang {page} / {totalPages} · {data.meta.total} người dùng
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Trang trước"
                  className="rounded p-1 hover:bg-background disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Trang sau"
                  className="rounded p-1 hover:bg-background disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <RoleChangeDialog user={roleTarget} onClose={() => setRoleTarget(undefined)} />
      <LockAccountDialog user={statusTarget} onClose={() => setStatusTarget(undefined)} />
      <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(undefined)} />
    </div>
  );
};
