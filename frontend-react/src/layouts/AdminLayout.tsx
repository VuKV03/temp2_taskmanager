import { NavLink, Outlet } from 'react-router';
import { ArrowLeft, History, Users, BarChart3 } from 'lucide-react';
import { cn } from '../shared/utils/cn';
import { ROUTES } from '../routes/routes';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-body',
    isActive ? 'bg-primary/10 font-medium text-primary' : 'text-text hover:bg-background',
  );

/**
 * AdminLayout: same shell as MainLayout, admin-only nav.
 * `/admin/users` and `/admin/statistic` links point at routes not registered
 * yet — added here so the nav is ready for `/fe-crud user-management` and
 * `/fe-crud statistic` to fill in without touching this file again.
 */
export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="p-4">
          <h1 className="text-lg font-heading font-semibold text-text">⚙️ Admin</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Điều hướng admin">
          <NavLink to={ROUTES.ADMIN_USERS} className={navLinkClass}>
            <Users className="h-4 w-4" />
            Người dùng
          </NavLink>
          <NavLink to={ROUTES.ADMIN_HISTORY} className={navLinkClass}>
            <History className="h-4 w-4" />
            Lịch sử hệ thống
          </NavLink>
          <NavLink to={ROUTES.ADMIN_STATISTIC} className={navLinkClass}>
            <BarChart3 className="h-4 w-4" />
            Thống kê
          </NavLink>

          <NavLink to={ROUTES.TODAY} className="mt-auto flex items-center gap-2 rounded-md px-2 py-1.5 text-body text-text-muted hover:bg-background">
            <ArrowLeft className="h-4 w-4" />
            Quay lại ứng dụng
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
