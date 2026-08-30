import { useState } from 'react';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuthStore, useLogout } from '../../../features/auth';
import { NotificationBell } from '../../../features/notification';
import { ThemeToggle } from '../ui';
import { cn } from '../../utils/cn';

export const Header = () => {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();
  const [open, setOpen] = useState(false);

  if (!user) return <header className="h-14 border-b border-border bg-surface" />;

  const initials = user.fullName
    .split(' ')
    .map((p) => p[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b border-border bg-surface px-6">
      <ThemeToggle />
      <NotificationBell />
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-small font-semibold text-white">
            {initials}
          </span>
          <span className="text-body text-text">{user.fullName}</span>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border bg-surface py-1 shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-small font-medium text-text">{user.fullName}</p>
                <p className="truncate text-small text-text-muted">{user.email}</p>
              </div>
              <button
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-small text-text hover:bg-background',
                )}
                onClick={() => setOpen(false)}
              >
                <UserIcon className="h-4 w-4" />
                Hồ sơ
              </button>
              <button
                disabled={isPending}
                onClick={() => logout()}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-small text-red-600 hover:bg-background disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
