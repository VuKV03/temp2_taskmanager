import { Outlet } from 'react-router';

/**
 * AuthLayout: Centered form layout for login/register
 * Used for public authentication pages
 */
export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text">📋 Task Manager</h1>
          <p className="mt-2 text-sm text-text-muted">Quản lý công việc mỗi ngày</p>
        </div>

        <Outlet />
      </div>
    </div>
  );
};
