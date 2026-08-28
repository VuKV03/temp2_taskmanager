import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-background hover:text-text"
      >
        <Bell className="h-5 w-5" />
        {!!unreadCount && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <NotificationDropdown onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
};
