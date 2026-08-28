import { useState } from 'react';
import { Link } from 'react-router';
import { MoreVertical, Eye, ShieldCheck, Lock, Unlock, KeyRound } from 'lucide-react';
import { ROUTES } from '../../../routes/routes';
import { cn } from '../../../shared/utils/cn';
import type { AdminUser } from '../types/user-management.types';

interface UserActionMenuProps {
  user: AdminUser;
  isSelf: boolean;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}

export const UserActionMenu = ({ user, isSelf, onChangeRole, onToggleStatus, onResetPassword }: UserActionMenuProps) => {
  const [open, setOpen] = useState(false);

  const itemClass = 'flex w-full items-center gap-2 px-3 py-2 text-left text-small text-text hover:bg-background';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Thao tác với ${user.fullName}`}
        className="rounded p-1 text-text-muted hover:bg-background hover:text-text"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-border bg-surface py-1 shadow-lg">
            <Link
              to={ROUTES.ADMIN_USER_DETAIL.replace(':id', String(user.id))}
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <Eye className="h-4 w-4" />
              Xem chi tiết
            </Link>

            {!isSelf && (
              <>
                <button
                  className={itemClass}
                  onClick={() => {
                    setOpen(false);
                    onChangeRole();
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Đổi role
                </button>
                <button
                  className={cn(itemClass, user.isActive && 'text-red-600')}
                  onClick={() => {
                    setOpen(false);
                    onToggleStatus();
                  }}
                >
                  {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {user.isActive ? 'Khoá tài khoản' : 'Mở khoá'}
                </button>
                <button
                  className={itemClass}
                  onClick={() => {
                    setOpen(false);
                    onResetPassword();
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                  Reset mật khẩu
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
